// app/composables/useStressTest.ts
import { getLog, logEvent } from '~/lib/crashlog'
import { THREADS_KEY } from '~/lib/llm/device'

/** Set before a reload so the test starts by itself once the model is ready again. */
const PENDING_KEY = 'afronet:stresstest-pending'
const DEFAULT_QUESTIONS = 30

/**
 * Automatic stability test: asks N questions in a row with pauses, logging each reply.
 * Target: 20–50 consecutive questions without a crash or restart.
 * Start with ?stresstest=30, or tap the header mark 5 times (works in the installed app).
 * Temporary: remove once on-device testing is finished.
 */
const QUESTIONS = [
    'What is the capital of Kenya?',
    'Give one tip for saving money.',
    'Name two crops that grow well in dry areas.',
    'How do I boil water safely?',
    'What is 12 times 7?',
    'Why should I wash my hands?',
    'What does a farmer do?',
    'How can I keep my phone battery healthy?',
    'What is the largest lake in Africa?',
    'Explain what a mesh network is, simply.',
    'Give one tip for studying for an exam.',
    'What is the longest river in Africa?',
]
const SHORT_PAUSE_MS = 5_000
/** Every 4th answer: wait past the window in which a crash shortly after a reply would show up. */
const LONG_PAUSE_MS = 25_000

const state = reactive({
    running: false,
    finished: false,
    total: 0,
    done: 0,
    errors: 0,
    lastTps: 0,
    avgTps: 0,
    avgFirstWordS: 0,
})
let stopRequested = false
let wakeLock: { release(): Promise<void> } | null = null

async function keepAwake() {
    try {
        wakeLock = await (navigator as Navigator & { wakeLock?: { request(t: 'screen'): Promise<any> } }).wakeLock?.request('screen') ?? null
    }
    catch { wakeLock = null }
}

function onVisibility() {
    // Wake locks are dropped when the page is hidden; take it again when it's back.
    if (state.running && document.visibilityState === 'visible') keepAwake()
}

function sleep(ms: number) {
    return new Promise<void>((resolve) => {
        const end = Date.now() + ms
        const tick = () => (stopRequested || Date.now() >= end) ? resolve() : setTimeout(tick, 250)
        tick()
    })
}

async function start(total: number) {
    if (state.running) return
    const chat = useChat()
    Object.assign(state, { running: true, finished: false, total, done: 0, errors: 0, lastTps: 0, avgTps: 0, avgFirstWordS: 0 })
    stopRequested = false
    document.addEventListener('visibilitychange', onVisibility)
    await keepAwake()
    logEvent(`stress test: starting ${total} questions (screen wake lock ${wakeLock ? 'on' : 'unavailable'})`)

    const tps: number[] = []
    const firstWord: number[] = []
    for (let i = 0; i < total && !stopRequested; i++) {
        if (i > 0 && i % 5 === 0) chat.clear() // keep history short and varied
        await chat.send(QUESTIONS[i % QUESTIONS.length]!)
        const reply = chat.messages.value.at(-1)
        if (reply?.status === 'error') state.errors++
        if (reply?.stats) {
            tps.push(reply.stats.tokensPerSecond)
            firstWord.push(reply.stats.ttftMs / 1000)
            state.lastTps = reply.stats.tokensPerSecond
        }
        state.done = i + 1
        logEvent(`stress test: ${state.done}/${total} answered`)
        if (state.done < total) await sleep(state.done % 4 === 0 ? LONG_PAUSE_MS : SHORT_PAUSE_MS)
    }

    const avg = (xs: number[]) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
    state.avgTps = avg(tps)
    state.avgFirstWordS = avg(firstWord)
    state.running = false
    state.finished = true
    document.removeEventListener('visibilitychange', onVisibility)
    await wakeLock?.release().catch(() => {})
    wakeLock = null
    logEvent(`stress test: ${stopRequested ? 'stopped' : 'FINISHED'} ${state.done}/${total} without restart, `
        + `${state.errors} errors, avg ${state.avgTps.toFixed(2)} tok/s, avg first word ${state.avgFirstWordS.toFixed(1)}s`)
}

function stop() {
    stopRequested = true
    useChat().stop()
}

async function copyLog() {
    const text = getLog().join('\n')
    try {
        await navigator.clipboard.writeText(text)
        return true
    }
    catch { return false }
}

// Hidden trigger: 5 taps on the logo within 3 seconds.
let taps: number[] = []
function registerTap() {
    const now = Date.now()
    taps = [...taps.filter(t => now - t < 3000), now]
    if (taps.length < 5 || state.running) return
    taps = []
    const llm = useLLM()
    if (llm.status.value !== 'ready') {
        alert('Load the model first, then tap the mark 5 times again to start the stability test.')
        return
    }
    const current = llm.caps.value?.threads ?? 1
    const answer = prompt(
        `Automatic stability test (${DEFAULT_QUESTIONS} questions). Keep the app open; it can take a while.\n\n`
        + `CPU threads to use: 1, 2 or 4 (currently ${current}).`,
        String(current),
    )
    if (answer === null) return
    const threads = Number(answer)
    if (![1, 2, 4].includes(threads)) {
        alert('Please enter 1, 2 or 4.')
        return
    }
    if (threads === current) {
        start(DEFAULT_QUESTIONS)
        return
    }
    // A different thread count needs a fresh engine: save it, reload, and start after loading.
    try {
        localStorage.setItem(THREADS_KEY, String(threads))
        localStorage.setItem(PENDING_KEY, String(DEFAULT_QUESTIONS))
    }
    catch {
        alert('Could not save the setting on this device.')
        return
    }
    logEvent(`stress test: switching to ${threads} threads, reloading`)
    location.reload()
}

/** Questions requested before a reload (see registerTap), consumed once. */
function takePending(): number {
    try {
        const n = Number(localStorage.getItem(PENDING_KEY)) || 0
        localStorage.removeItem(PENDING_KEY)
        return n
    }
    catch { return 0 }
}

export function useStressTest() {
    return { state: readonly(state), start, stop, copyLog, registerTap, takePending }
}
