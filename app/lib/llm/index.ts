// app/lib/llm/index.ts
import { detectDevice, type DeviceCaps } from './device'
// (detectDevice is also re-exported below so callers can detect once and pass it in.)
import { DEFAULT_MODEL, MODELS, fileUrl, variantKey, type ModelSpec } from './models'
import { CACHE_NAME } from './protocol'
import { TransformersEngine, variantFor } from './transformers-engine'
import type { LLMEngine } from './types'

export type * from './types'
export type { DeviceCaps } from './device'
export type { ModelSpec } from './models'
export { detectDevice } from './device'
export { MODELS, DEFAULT_MODEL } from './models'

/**
 * Saved model choice — per device (localStorage), never per account: the right model depends on
 * the hardware, and a laptop's choice synced to a phone would mean a 1.1 GB download on the phone.
 */
const MODEL_KEY = 'afronet:model'

/**
 * The model this launch uses: ?model=<key> (remembered), then the saved choice, then what suits
 * this device.
 */
export function selectedModel(caps?: DeviceCaps): ModelSpec {
    const fallback = caps ? recommendedModel(caps) : DEFAULT_MODEL
    const param = new URLSearchParams(location.search).get('model')
    try {
        if (param && MODELS.some(m => m.key === param)) localStorage.setItem(MODEL_KEY, param)
        const saved = localStorage.getItem(MODEL_KEY)
        return MODELS.find(m => m.key === saved) ?? fallback
    }
    catch {
        return MODELS.find(m => m.key === param) ?? fallback
    }
}

/** Remembers a choice for this device. Takes effect when the engine next starts. */
export function saveSelectedModel(key: string) {
    try { localStorage.setItem(MODEL_KEY, key) }
    catch { /* storage unavailable: the choice lasts for this session only */ }
}

/** What this device should use by default: the big model only on a capable machine, once verified. */
export function recommendedModel(caps: DeviceCaps): ModelSpec {
    if (caps.phone || caps.device !== 'webgpu') return DEFAULT_MODEL
    const big = MODELS.find(m => m.recommendedFor === 'laptops' && m.verified)
    return big ?? DEFAULT_MODEL
}

/** Files this model needs on this device, and how big the download is. */
export function variantOn(spec: ModelSpec, caps: DeviceCaps) {
    return spec.variants[variantKey(caps.device, caps.shaderF16)]
}

/** Whether every file of this model is already on the device. */
export async function isModelCached(spec: ModelSpec, caps: DeviceCaps) {
    const variant = variantOn(spec, caps)
    if (!variant || !('caches' in globalThis)) return false
    const cache = await caches.open(CACHE_NAME)
    const hits = await Promise.all(variant.files.map(f => cache.match(fileUrl(spec, f))))
    return hits.every(Boolean)
}

/** Removes one model's downloaded files, for every variant, freeing the storage. */
export async function deleteModelFiles(spec: ModelSpec) {
    if (!('caches' in globalThis)) return
    const cache = await caches.open(CACHE_NAME)
    for (const variant of Object.values(spec.variants)) {
        for (const file of variant.files) await cache.delete(fileUrl(spec, file))
    }
}

/**
 * The one place that decides which model and runtime the app uses.
 * `engine` is null when this device can't run the model at all.
 */
export async function createEngine(model: ModelSpec, known?: DeviceCaps): Promise<{ engine: LLMEngine | null, caps: DeviceCaps }> {
    const caps = known ?? await detectDevice()
    const engine = variantFor(model, caps) ? new TransformersEngine(model, caps) : null
    return { engine, caps }
}
