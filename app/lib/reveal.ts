// app/lib/reveal.ts
//
// Paces streamed text onto the screen so replies read like steady typing.
//
// On phones the model produces text unevenly (bursts, then multi-second stalls). Instead of
// printing each burst at once, we reveal characters at the reply's average incoming speed and let
// the display run up to MAX_LAG_MS behind, which bridges short stalls. Longer stalls still show
// as a pause; the backlog is never allowed to lag further than that.

const TICK_MS = 40
const MAX_LAG_MS = 2000
const MIN_CHARS_PER_SEC = 8

export interface Revealer {
    /** Queue newly generated text. */
    push(text: string): void
    /** Reveal whatever is left quickly, then resolve. */
    finish(): Promise<void>
    /** Stop immediately, revealing everything that's queued. */
    flush(): void
}

export function createRevealer(append: (text: string) => void): Revealer {
    let pending = ''
    let received = 0
    let firstAt = 0
    let draining = false
    let timer: ReturnType<typeof setInterval> | null = null
    let onEmpty: (() => void) | null = null

    const step = () => {
        if (!pending) {
            if (draining) stop()
            return
        }
        const elapsed = Math.max(0.5, (performance.now() - firstAt) / 1000)
        const rate = Math.max(MIN_CHARS_PER_SEC, received / elapsed) // average chars/s so far
        // Base pace + enough extra to keep the backlog under MAX_LAG_MS (or ~300 ms when finishing).
        const backlogTicks = (draining ? 300 : MAX_LAG_MS) / TICK_MS
        const count = Math.max(1, Math.round(rate * TICK_MS / 1000 + pending.length / backlogTicks))
        append(pending.slice(0, count))
        pending = pending.slice(count)
    }

    const stop = () => {
        if (timer) clearInterval(timer)
        timer = null
        onEmpty?.()
        onEmpty = null
    }

    return {
        push(text) {
            if (!text) return
            if (!firstAt) firstAt = performance.now()
            received += text.length
            pending += text
            timer ??= setInterval(step, TICK_MS)
        },
        finish() {
            draining = true
            if (!pending) {
                stop()
                return Promise.resolve()
            }
            timer ??= setInterval(step, TICK_MS)
            return new Promise((resolve) => { onEmpty = resolve })
        },
        flush() {
            if (pending) append(pending)
            pending = ''
            stop()
        },
    }
}
