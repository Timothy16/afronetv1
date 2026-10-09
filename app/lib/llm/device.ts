// app/lib/llm/device.ts
import type { Device } from './types'

export interface DeviceCaps {
    device: Device
    shaderF16: boolean
    /** Phones/tablets get tighter memory limits (shorter replies and history). */
    phone: boolean
    /** WebKit (Safari, and every browser on iOS): always uses the CPU path. */
    webkit: boolean
    /** WASM threads to use (effective only when the page is cross-origin isolated). */
    threads: number
    /** Why this device was chosen — shown in the about/debug panel. */
    reason: string
}

/** Phones and tablets, including iPads that report a desktop user agent. */
function isPhone() {
    const uaData = (navigator as Navigator & { userAgentData?: { mobile?: boolean } }).userAgentData
    if (uaData?.mobile) return true
    if (/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent)) return true
    return /Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1
}

/** Safari's engine. On iOS every browser uses it (Chrome there reports "CriOS", not "Chrome"). */
function isWebKit() {
    const ua = navigator.userAgent
    return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg|OPR|SamsungBrowser|Android/.test(ua)
}

/** Saved thread-count override (set via ?threads=N or the stability-test menu). */
export const THREADS_KEY = 'afronet:threads'

/**
 * Phones use 2 threads: in three back-to-back 30-question runs on an iPhone 14 Pro (2026-10-07,
 * SmolLM2 360M int8, CPU, cross-origin isolated) 2 threads gave 24.5 tok/s vs 16.8 at 1 and
 * 17.3 at 4 — phones have 2 fast cores plus slower ones, so 4 threads wait on the slow ones.
 * Desktops use up to 4 (ONNX Runtime guidance).
 */
function chooseThreads(phone: boolean, param: string | null) {
    try { if (param) localStorage.setItem(THREADS_KEY, param) }
    catch { /* storage unavailable: use defaults */ }
    let saved: number | null = null
    try { saved = Number(localStorage.getItem(THREADS_KEY)) || null }
    catch { saved = null }
    if (saved) return Math.max(1, Math.min(4, saved))
    return phone ? 2 : Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1))
}

/**
 * WebGPU when an adapter is available (f16 if supported), otherwise WASM/CPU; WebKit uses the CPU.
 * `?device=wasm` / `?device=webgpu` in the URL force a path for testing.
 */
export async function detectDevice(): Promise<DeviceCaps> {
    const params = new URLSearchParams(location.search)
    const phone = isPhone()
    const webkit = isWebKit()
    const threads = chooseThreads(phone, params.get('threads'))
    const forced = params.get('device')

    if (forced === 'wasm') return { device: 'wasm', shaderF16: false, phone, webkit, threads, reason: 'forced via ?device=wasm' }

    // On WebKit the GPU path gets the page killed seconds after each reply (onnxruntime#26827),
    // so use the CPU there. ?device=webgpu forces the GPU for comparison.
    if (webkit && forced !== 'webgpu') {
        return { device: 'wasm', shaderF16: false, phone, webkit, threads, reason: 'CPU on WebKit (GPU path crashes after replies)' }
    }

    const gpu = (navigator as Navigator & { gpu?: { requestAdapter(): Promise<any> } }).gpu
    if (!gpu) return { device: 'wasm', shaderF16: false, phone, webkit, threads, reason: 'WebGPU not available in this browser' }

    try {
        const adapter = await gpu.requestAdapter()
        if (!adapter) return { device: 'wasm', shaderF16: false, phone, webkit, threads, reason: 'no WebGPU adapter' }
        const shaderF16 = adapter.features.has('shader-f16')
        return { device: 'webgpu', shaderF16, phone, webkit, threads, reason: shaderF16 ? 'WebGPU with f16' : 'WebGPU without f16' }
    }
    catch {
        return { device: 'wasm', shaderF16: false, phone, webkit, threads, reason: 'WebGPU adapter request failed' }
    }
}
