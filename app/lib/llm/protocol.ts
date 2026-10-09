// app/lib/llm/protocol.ts
//
// Messages between AfronetTransformersEngine (main thread) and transformers.worker.ts.
import type { ChatMessage, Device, GenerateStats, LoadProgress } from './types'
import type { Sampling } from './models'

/** Cache Storage bucket transformers.js reads model files from (its default `env.cacheKey`). */
export const CACHE_NAME = 'transformers-cache'

export interface WorkerLoadConfig {
    id: string
    revision: string
    device: Device
    dtype: string
    /** Repo-relative files to prefetch into the cache. */
    files: string[]
    downloadBytes: number
    externalData?: boolean
    /** Max prompt tokens; older turns are dropped beyond it. */
    promptBudget: number
    /** WASM threads to use when the worker is cross-origin isolated. */
    threads: number
    sampling: Sampling
}

export type ToWorker =
    | { type: 'load', config: WorkerLoadConfig }
    /** Fetch the model files into the cache and stop there — used during sign-up. */
    | { type: 'download', config: WorkerLoadConfig }
    | { type: 'generate', id: number, messages: ChatMessage[], maxNewTokens: number }
    | { type: 'interrupt' }

export type FromWorker =
    | { type: 'progress', progress: LoadProgress }
    | { type: 'ready' }
    | { type: 'load-error', message: string }
    /** Diagnostic line for the crash log. */
    | { type: 'log', message: string }
    | { type: 'token', id: number, text: string }
    | { type: 'done', id: number, stats: GenerateStats }
    | { type: 'generate-error', id: number, message: string }
