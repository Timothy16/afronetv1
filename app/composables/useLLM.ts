// app/composables/useLLM.ts
import {
    createEngine,
    deleteModelFiles,
    downloadModelFiles,
    detectDevice,
    isModelCached,
    saveSelectedModel,
    selectedModel,
    variantOn,
    MODELS,
    type DeviceCaps,
    type EngineInfo,
    type LLMEngine,
    type LoadProgress,
    type ModelSpec,
} from '~/lib/llm'
import { formatBytes, requestPersistentStorage, storageEstimate } from '~/lib/deviceStorage'
import { logEvent } from '~/lib/crashlog'

export type LLMStatus = 'detecting' | 'unsupported' | 'needs-download' | 'cached' | 'loading' | 'ready' | 'error'

/**
 * Set while a load is in progress and cleared when it ends. If it's still there on the next
 * launch, the page died mid-setup (e.g. iOS killed the tab for using too much memory) —
 * we then wait for the user instead of auto-loading straight into the same crash.
 */
const SETUP_MARKER = 'afronet:setup-in-progress'

// App-wide singleton: one engine, one model in memory.
let engine: LLMEngine | null = null
let initPromise: Promise<void> | null = null

const status = ref<LLMStatus>('detecting')
const info = shallowRef<EngineInfo | null>(null)
const caps = shallowRef<DeviceCaps | null>(null)
const progress = shallowRef<LoadProgress | null>(null)
/** True while loading files that were already on the device (no network download). */
const fromCache = ref(false)
/** When the current load entered the 'init' phase (ms since epoch), for an elapsed-time display. */
const initStartedAt = ref<number | null>(null)
/** The previous launch was cut off during setup. */
const interrupted = ref(false)
/** The model was downloaded before and is gone now — phones clear storage to make room. */
const evicted = ref(false)
const error = ref<string | null>(null)
const persisted = ref<boolean | null>(null)
const storage = shallowRef<{ usage: number, quota: number } | null>(null)

/** Chosen once per launch; the picker reads it, so it has to be reactive. */
const model = shallowRef<ModelSpec | null>(null)
let markerValue = ''

/** Remembers that this exact model was fully downloaded and running on this device. */
const READY_KEY = 'afronet:model-ready'
function setReadyMarker() {
    try { localStorage.setItem(READY_KEY, markerValue) }
    catch { /* best effort */ }
}
function readReadyMarker() {
    try { return localStorage.getItem(READY_KEY) }
    catch { return null }
}
function clearReadyMarker() {
    try { localStorage.removeItem(READY_KEY) }
    catch { /* best effort */ }
}

function setMarker(on: boolean) {
    try {
        if (on) localStorage.setItem(SETUP_MARKER, markerValue)
        else localStorage.removeItem(SETUP_MARKER)
    }
    catch { /* storage unavailable: crash detection is best-effort */ }
}

function readMarker() {
    try { return localStorage.getItem(SETUP_MARKER) === markerValue }
    catch { return false }
}

async function refreshStorage() {
    storage.value = await storageEstimate()
    if (storage.value) logEvent(`storage used ${formatBytes(storage.value.usage)} of ${formatBytes(storage.value.quota)}`)
}

function init() {
    if (!import.meta.client) return Promise.resolve()
    initPromise ??= (async () => {
        // Detect the hardware first: with no saved choice, that decides which model suits it.
        const detected = await detectDevice()
        model.value = selectedModel(detected)
        markerValue = `${model.value.id}@${model.value.revision}`
        interrupted.value = readMarker()

        const created = await createEngine(model.value, detected)
        caps.value = created.caps
        engine = created.engine
        const c = created.caps
        logEvent(`device: ${c.device} (${c.reason})${c.phone ? ', phone' : ''}, page isolated ${self.crossOriginIsolated === true}, cores ${navigator.hardwareConcurrency ?? '?'}, threads ${c.threads}${c.webkit ? ', webkit' : ''}; model ${model.value.label} ${engine?.info.dtype ?? ''}`)

        if (!engine) {
            status.value = 'unsupported'
            logEvent('unsupported device')
            return
        }
        info.value = engine.info
        await engine.pruneCache?.().catch(err => logEvent(`cache cleanup failed: ${err}`))
        status.value = (await engine.isCached()) ? 'cached' : 'needs-download'
        // Downloaded before, missing now: the device cleared it rather than the user.
        evicted.value = status.value === 'needs-download' && readReadyMarker() === markerValue
        if (evicted.value) clearReadyMarker()
        logEvent(`status: ${status.value}${interrupted.value ? ' (previous setup was interrupted)' : ''}${evicted.value ? ' (model was removed by the device)' : ''}`)
        await refreshStorage()
    })().catch((err) => {
        status.value = 'error'
        error.value = err instanceof Error ? err.message : String(err)
        logEvent(`init error: ${error.value}`)
    })
    return initPromise
}

async function load() {
    await init()
    if (!engine || status.value === 'ready' || status.value === 'loading') return
    fromCache.value = status.value === 'cached'
    status.value = 'loading'
    error.value = null
    progress.value = null
    initStartedAt.value = null
    setMarker(true)
    const started = Date.now()
    logEvent(fromCache.value ? 'load: starting from device storage' : 'load: download started')
    let nextLoggedPct = 25

    try {
        persisted.value = await requestPersistentStorage()
        logEvent(`persistent storage: ${persisted.value ? 'granted' : 'not granted'}`)
        await engine.load((p) => {
            progress.value = p
            if (p.phase === 'download' && p.percent >= nextLoggedPct) {
                logEvent(`download ${Math.floor(p.percent)}% (${formatBytes(p.loaded)})`)
                nextLoggedPct = (Math.floor(p.percent / 25) + 1) * 25
            }
            if (p.phase === 'init' && !initStartedAt.value) {
                initStartedAt.value = Date.now()
                logEvent('load: files ready, starting model')
            }
        })
        info.value = engine.info // may have changed if WebGPU fell back to WASM
        status.value = 'ready'
        interrupted.value = false
        evicted.value = false
        setReadyMarker()
        logEvent(`load: ready in ${((Date.now() - started) / 1000).toFixed(1)}s on ${engine.info.device}`)
    }
    catch (err) {
        status.value = 'error'
        error.value = err instanceof Error ? err.message : String(err)
        logEvent(`load error: ${error.value}`)
    }
    finally {
        setMarker(false)
        await refreshStorage()
    }
}

/**
 * Switching model means a fresh start: the page reloads, which is the surest way to free the
 * memory the previous model held — the thing phones are tightest on. Conversations are saved,
 * so nothing is lost.
 */
function switchModel(key: string) {
    if (!MODELS.some(m => m.key === key) || key === model.value?.key) return
    logEvent(`model switched to ${key}`)
    saveSelectedModel(key)
    location.reload()
}

// --- Sign-up download -------------------------------------------------------------------
// The chat page has its own setup card; this is the same download run earlier, during sign-up,
// so the chat opens with the model already on the device.
const downloading = ref(false)
const downloadProgress = shallowRef<LoadProgress | null>(null)
const downloadError = ref<string | null>(null)

async function downloadModel(key?: string) {
    await init()
    const detected = caps.value ?? await detectDevice()
    const spec = MODELS.find(m => m.key === key) ?? model.value
    if (!spec) return false

    downloadError.value = null
    downloadProgress.value = null

    if (!variantOn(spec, detected)) {
        downloadError.value = `${spec.label} can't run on this device`
        return false
    }

    // Remember the choice for this device either way, so the chat starts the same model.
    saveSelectedModel(spec.key)

    if (await isModelCached(spec, detected)) {
        logEvent(`sign-up: ${spec.label} already on this device`)
        return true
    }

    downloading.value = true
    logEvent(`sign-up: downloading ${spec.label}`)
    try {
        await requestPersistentStorage()
        await downloadModelFiles(spec, detected, (p) => { downloadProgress.value = p })
        // The chat page reads the cache, so its own setup card will find this and start it.
        status.value = 'cached'
        logEvent(`sign-up: ${spec.label} downloaded`)
        return true
    }
    catch (err) {
        downloadError.value = err instanceof Error ? err.message : String(err)
        logEvent(`sign-up download failed: ${downloadError.value}`)
        return false
    }
    finally {
        downloading.value = false
        await refreshStorage()
    }
}

/** Models with what this device would download, and whether it already has them. */
async function modelOptions(): Promise<Array<{
    spec: ModelSpec
    downloadBytes: number
    cached: boolean
    runnable: boolean
    current: boolean
}>> {
    const detected = caps.value ?? await detectDevice()
    return Promise.all(MODELS.map(async (spec) => {
        const variant = variantOn(spec, detected)
        return {
            spec,
            downloadBytes: variant?.downloadBytes ?? 0,
            cached: variant ? await isModelCached(spec, detected) : false,
            runnable: Boolean(variant),
            current: spec.key === model.value?.key,
        }
    }))
}

/** Frees a downloaded model's storage. The one in use can only be removed after switching away. */
async function deleteModel(key: string) {
    const spec = MODELS.find(m => m.key === key)
    if (!spec || spec.key === model.value?.key) return
    await deleteModelFiles(spec)
    // A deliberate delete is not an eviction; don't warn about it next launch.
    if (readReadyMarker() === `${spec.id}@${spec.revision}`) clearReadyMarker()
    logEvent(`deleted downloaded files for ${spec.label}`)
    await refreshStorage()
}

export function useLLM() {
    init()
    return {
        model: readonly(model),
        modelOptions,
        downloadModel,
        downloading: readonly(downloading),
        downloadProgress: readonly(downloadProgress),
        downloadError: readonly(downloadError),
        switchModel,
        deleteModel,
        status: readonly(status),
        info: readonly(info),
        caps: readonly(caps),
        progress: readonly(progress),
        fromCache: readonly(fromCache),
        initStartedAt: readonly(initStartedAt),
        interrupted: readonly(interrupted),
        evicted: readonly(evicted),
        /** Free space against what this model needs, for the warning before a download. */
        spaceCheck: async () => {
            const estimate = await storageEstimate()
            const needed = Math.round((info.value?.downloadBytes ?? 0) * 1.05)
            if (!estimate || !needed) return { ok: true, needed, free: 0 }
            const free = Math.max(0, estimate.quota - estimate.usage)
            return { ok: free >= needed, needed, free }
        },
        error: readonly(error),
        persisted: readonly(persisted),
        storage: readonly(storage),
        modelLabel: () => model.value?.label ?? '',
        load,
        /** Throws if called before the model is ready. */
        engine: () => {
            if (!engine || status.value !== 'ready') throw new Error('Model is not ready')
            return engine
        },
    }
}
