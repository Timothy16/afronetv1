// app/lib/llm/transformers-engine.ts
import type { ChatMessage, EngineInfo, GenerateOptions, GenerateStats, LLMEngine, LoadProgress } from './types'
import { CACHE_NAME, type FromWorker, type ToWorker } from './protocol'
import { MODELS, fileUrl, variantKey, type ModelSpec, type ModelVariant } from './models'
import type { DeviceCaps } from './device'
import { logEvent } from '~/lib/crashlog'

/** Phones get shorter replies and history: less memory per reply, within tight browser limits. */
const LIMITS = {
    phone: { maxNewTokens: 256, promptBudget: 1024 },
    other: { maxNewTokens: 512, promptBudget: 1536 },
    // CPU path (iPhone, phones without WebGPU): same as phones now that the model fits.
    cpu: { maxNewTokens: 256, promptBudget: 1024 },
}

/**
 * Upper bound for turning cached files into a running model. Phones that run out of memory here
 * can stall instead of failing (seen on a 4 GB Samsung), so give up and say so.
 *
 * Counted in *visible* time only. A phone suspends a backgrounded page, so a plain timer kept
 * running while the work was paused and reported a failure for a load that was merely waiting
 * for the user to come back.
 */
const INIT_TIMEOUT_MS = 3 * 60_000
/** How often the watchdog checks; also the granularity of the visible-time count. */
const WATCHDOG_TICK_MS = 1_000

export function variantFor(spec: ModelSpec, caps: DeviceCaps): ModelVariant | undefined {
    return spec.variants[variantKey(caps.device, caps.shaderF16)]
}

/** LLMEngine backed by transformers.js running in a dedicated Web Worker. */
export class TransformersEngine implements LLMEngine {
    info: EngineInfo
    lastStats: GenerateStats | null = null

    private worker: Worker | null = null
    private loading: Promise<void> | null = null
    private nextId = 1
    private busy = false

    /** Only construct for devices the model has a variant for (see `variantFor`). */
    constructor(private spec: ModelSpec, private caps: DeviceCaps) {
        this.info = this.infoFor(caps)
    }

    private get limits() {
        if (this.caps.device === 'wasm') return LIMITS.cpu
        return this.caps.phone ? LIMITS.phone : LIMITS.other
    }

    private variant(caps = this.caps) {
        const variant = variantFor(this.spec, caps)
        if (!variant) throw new Error(`${this.spec.label} can't run on ${caps.device} on this device`)
        return variant
    }

    private infoFor(caps: DeviceCaps): EngineInfo {
        const variant = this.variant(caps)
        return { modelId: this.spec.id, device: caps.device, dtype: variant.dtype, downloadBytes: variant.downloadBytes }
    }

    async isCached() {
        if (!('caches' in self)) return false
        const cache = await caches.open(CACHE_NAME)
        const hits = await Promise.all(this.variant().files.map(f => cache.match(fileUrl(this.spec, f))))
        return hits.every(Boolean)
    }

    /**
     * Clears out files that belong to no model we still offer — old revisions or variants.
     * A model the user downloaded and may switch back to is kept; removing one is done from the
     * model picker, on purpose.
     */
    async pruneCache() {
        if (!('caches' in self)) return
        const cache = await caches.open(CACHE_NAME)
        const keep = new Set<string>()
        for (const spec of MODELS) {
            for (const variant of Object.values(spec.variants)) {
                for (const file of variant.files) keep.add(fileUrl(spec, file))
            }
        }
        for (const req of await cache.keys()) {
            // transformers.js also caches the ONNX Runtime files here; only drop model files.
            if (req.url.startsWith('https://huggingface.co/') && !keep.has(req.url)) await cache.delete(req)
        }
    }

    /**
     * Downloads the model files into the cache without starting the model. The worker is
     * discarded afterwards, so nothing stays resident.
     */
    download(onProgress?: (p: LoadProgress) => void) {
        const variant = this.variant()
        const worker = new Worker(new URL('./transformers.worker.ts', import.meta.url), { type: 'module' })

        return new Promise<void>((resolve, reject) => {
            const finish = (err?: Error) => {
                worker.terminate()
                err ? reject(err) : resolve()
            }
            worker.addEventListener('message', (e: MessageEvent<FromWorker>) => {
                const msg = e.data
                if (msg.type === 'progress') onProgress?.(msg.progress)
                else if (msg.type === 'log') logEvent(msg.message)
                else if (msg.type === 'ready') finish()
                else if (msg.type === 'load-error') finish(new Error(msg.message))
            })
            worker.addEventListener('error', (e: ErrorEvent) => finish(new Error(e.message || 'The download could not start')))

            worker.postMessage({
                type: 'download',
                config: {
                    id: this.spec.id,
                    revision: this.spec.revision,
                    device: this.caps.device,
                    dtype: variant.dtype,
                    files: variant.files,
                    downloadBytes: variant.downloadBytes,
                    externalData: variant.externalData,
                    promptBudget: this.limits.promptBudget,
                    sampling: this.spec.sampling,
                    threads: this.caps.threads,
                },
            } satisfies ToWorker)
        })
    }

    load(onProgress?: (p: LoadProgress) => void) {
        this.loading ??= this.loadWithFallback(onProgress).catch((err) => {
            this.loading = null
            throw err
        })
        return this.loading
    }

    private async loadWithFallback(onProgress?: (p: LoadProgress) => void) {
        try {
            await this.loadOn(this.caps, onProgress)
        }
        catch (err) {
            const cpu: DeviceCaps = { ...this.caps, device: 'wasm', shaderF16: false, reason: `WebGPU failed: ${(err as Error).message}` }
            if (this.caps.device !== 'webgpu' || !variantFor(this.spec, cpu)) throw err
            // WebGPU exists but failed (driver bugs, OOM on low-end GPUs). Retry on CPU.
            logEvent(`WebGPU load failed, retrying on CPU: ${(err as Error).message}`)
            this.caps = cpu
            this.info = this.infoFor(cpu)
            await this.loadOn(cpu, onProgress)
        }
    }

    private loadOn(caps: DeviceCaps, onProgress?: (p: LoadProgress) => void) {
        this.worker?.terminate()

        let worker: Worker
        try {
            worker = new Worker(new URL('./transformers.worker.ts', import.meta.url), { type: 'module' })
        }
        catch (err) {
            const message = err instanceof Error ? err.message : String(err)
            logEvent(`worker could not be created: ${message}`)
            return Promise.reject(new Error(`The AI worker could not start: ${message}`))
        }

        this.worker = worker
        const variant = this.variant(caps)

        return new Promise<void>((resolve, reject) => {
            // Visible-time watchdog for the init phase (see INIT_TIMEOUT_MS).
            let watchdog: ReturnType<typeof setInterval> | undefined
            let visibleMs = 0
            let hiddenMs = 0

            const startWatchdog = () => {
                if (watchdog) return
                watchdog = setInterval(() => {
                    // document is undefined inside a worker, but this runs on the main thread.
                    if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
                        hiddenMs += WATCHDOG_TICK_MS
                        return
                    }
                    visibleMs += WATCHDOG_TICK_MS
                    if (visibleMs < INIT_TIMEOUT_MS) return

                    const waited = Math.round(visibleMs / 1000)
                    const paused = hiddenMs > 5_000 ? `, plus ${Math.round(hiddenMs / 1000)}s while the app was in the background` : ''
                    logEvent(`init gave up after ${waited}s on screen${paused}`)
                    // No "try a smaller model" here: this is already the smallest one offered.
                    fail(
                        `Starting ${this.spec.label} took too long. Your device may be low on free memory — `
                        + 'close other apps and browser tabs, turn off battery saver, and try again.',
                    )
                }, WATCHDOG_TICK_MS)
            }

            const fail = (message: string) => {
                cleanup()
                worker.terminate()
                if (this.worker === worker) this.worker = null
                reject(new Error(message))
            }
            const onMessage = (e: MessageEvent<FromWorker>) => {
                const msg = e.data
                if (msg.type === 'progress') {
                    if (msg.progress.phase === 'init') startWatchdog()
                    onProgress?.(msg.progress)
                }
                else if (msg.type === 'log') logEvent(msg.message)
                else if (msg.type === 'ready') { cleanup(); resolve() }
                else if (msg.type === 'load-error') fail(msg.message)
            }
            const onError = (e: ErrorEvent) => {
                // A module worker that fails to load or evaluate reports an ErrorEvent whose
                // message is often empty, so log every field for the crash log / bug reports.
                const where = [e.filename, e.lineno].filter(Boolean).join(':')
                const detail = [e.message, where].filter(Boolean).join(' at ') || 'no details from the browser'
                logEvent(`worker error event: ${detail}`)
                fail(`The AI worker failed to start (${detail}). Reload the page; if it keeps happening, restart the app.`)
            }
            // Fires when a posted message can't be deserialised — rare, but silent otherwise.
            const onMessageError = () => {
                logEvent('worker message could not be read')
                fail('The AI worker sent something this browser could not read.')
            }
            const cleanup = () => {
                clearInterval(watchdog)
                worker.removeEventListener('message', onMessage)
                worker.removeEventListener('error', onError)
                worker.removeEventListener('messageerror', onMessageError)
            }
            worker.addEventListener('message', onMessage)
            worker.addEventListener('error', onError)
            worker.addEventListener('messageerror', onMessageError)
            logEvent(`worker created for ${caps.device}; loading ${this.spec.label}`)

            this.post({
                type: 'load',
                config: {
                    id: this.spec.id,
                    revision: this.spec.revision,
                    device: caps.device,
                    dtype: variant.dtype,
                    files: variant.files,
                    downloadBytes: variant.downloadBytes,
                    externalData: variant.externalData,
                    promptBudget: this.limits.promptBudget,
                    sampling: this.spec.sampling,
                    threads: caps.threads,
                },
            })
        })
    }

    async *generate(messages: ChatMessage[], opts: GenerateOptions = {}): AsyncIterable<string> {
        await this.load()
        if (this.busy) throw new Error('A reply is already being generated')
        this.busy = true

        const worker = this.worker!
        const id = this.nextId++
        const queue: string[] = []
        let finished = false
        let failure: Error | null = null
        let wake: (() => void) | null = null
        const notify = () => { wake?.(); wake = null }

        const onMessage = (e: MessageEvent<FromWorker>) => {
            const msg = e.data
            if (!('id' in msg) || msg.id !== id) return
            if (msg.type === 'token') queue.push(msg.text)
            else if (msg.type === 'done') { this.lastStats = msg.stats; finished = true }
            else if (msg.type === 'generate-error') { failure = new Error(msg.message); finished = true }
            notify()
        }
        const onAbort = () => this.post({ type: 'interrupt' })

        worker.addEventListener('message', onMessage)
        opts.signal?.addEventListener('abort', onAbort)
        if (opts.signal?.aborted) onAbort()

        try {
            this.post({ type: 'generate', id, messages, maxNewTokens: opts.maxNewTokens ?? this.limits.maxNewTokens })
            while (true) {
                if (queue.length) { yield queue.shift()!; continue }
                if (finished) break
                await new Promise<void>((r) => { wake = r })
            }
            if (failure) throw failure
        }
        finally {
            // If the consumer stops early, make sure the worker stops too.
            if (!finished) onAbort()
            worker.removeEventListener('message', onMessage)
            opts.signal?.removeEventListener('abort', onAbort)
            this.busy = false
        }
    }

    private post(msg: ToWorker) {
        this.worker!.postMessage(msg)
    }
}
