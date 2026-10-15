// app/composables/useChat.ts
import type { ChatMessage, GenerateStats } from '~/lib/llm'
import { logEvent } from '~/lib/crashlog'
import { createRevealer } from '~/lib/reveal'
import {
    getConversation,
    listMessages,
    newId,
    nowIso,
    putConversation,
    putMessage,
    queueOp,
    titleFrom,
    type StoredConversation,
    type StoredMessage,
} from '~/lib/chatStore'

export interface UiMessage {
    id: string
    /** Position in the conversation; see StoredMessage.seq. */
    seq: number
    role: 'user' | 'assistant'
    content: string
    /** 'streaming' only exists on screen; what gets saved is always a final state. */
    status: 'done' | 'streaming' | 'stopped' | 'error'
    error?: string
    /** 'brain': a saved correction shown instead of asking the model. */
    source?: 'brain'
    model?: string
    stats?: GenerateStats
    createdAt: string
}

/** Also used by the brain test page, so it measures the prompt real chats get. */
export const SYSTEM_PROMPT = 'You are Afronet, a helpful assistant running offline on the user\'s device. '
    + 'Answer clearly and concisely.'

/** The chat the previous build kept outside conversations; imported once, then removed. */
const LEGACY_KEY = 'afronet:chat'

const messages = ref<UiMessage[]>([])
const activeId = ref<string | null>(null)
const generating = ref(false)
const loadingConversation = ref(false)
let controller: AbortController | null = null

/** Logs "still alive" checkpoints after a reply, to pin down crashes that happen shortly after one. */
let aliveTimers: ReturnType<typeof setTimeout>[] = []
function logAliveAfterReply() {
    aliveTimers.forEach(clearTimeout)
    aliveTimers = [2, 5, 10, 20].map(s => setTimeout(() => logEvent(`alive ${s}s after reply`), s * 1000))
}

function toUi(m: StoredMessage): UiMessage {
    return { id: m.id, seq: m.seq ?? 0, role: m.role, content: m.content, status: m.status, source: m.source, model: m.model, stats: m.stats, createdAt: m.createdAt }
}

function toStored(m: UiMessage, conversationId: string, userId: string): StoredMessage {
    return {
        id: m.id,
        conversationId,
        userId,
        seq: m.seq,
        role: m.role,
        content: m.content,
        // Nothing half-written is ever saved.
        status: m.status === 'streaming' ? 'stopped' : m.status,
        source: m.source,
        model: m.model,
        stats: m.stats,
        createdAt: m.createdAt,
    }
}

/** Next position in the open conversation. */
function nextSeq() {
    return messages.value.reduce((max, m) => Math.max(max, m.seq ?? 0), -1) + 1
}

/** Start a new, empty chat. The conversation record is only created once a question is sent. */
function newChat() {
    if (generating.value) return
    activeId.value = null
    messages.value = []
    logEvent('new chat')
}

async function openConversation(id: string) {
    if (activeId.value === id && messages.value.length) return
    loadingConversation.value = true
    try {
        let stored = await listMessages(id)
        if (!stored.length) {
            const fetched = await useChatSync().fetchMessagesIfMissing(id)
            if (fetched) stored = await listMessages(id)
        }
        messages.value = stored.map(toUi)
        activeId.value = id
    }
    catch (err) {
        logEvent(`opening conversation failed: ${err}`)
        messages.value = []
        activeId.value = null
    }
    finally {
        loadingConversation.value = false
    }
}

/** The conversation this chat belongs to, created on the first question. */
async function ensureConversation(firstQuestion: string): Promise<StoredConversation | null> {
    const { currentUserId, touch } = useConversations()
    const userId = currentUserId()
    if (!userId) return null

    if (activeId.value) {
        const existing = await getConversation(activeId.value)
        if (existing) return existing
    }

    const at = nowIso()
    const conversation: StoredConversation = {
        id: newId(),
        userId,
        title: titleFrom(firstQuestion),
        createdAt: at,
        updatedAt: at,
        deletedAt: null,
    }
    await putConversation(conversation)
    await touch(conversation)
    activeId.value = conversation.id
    await queueOp({ userId, kind: 'conversation', id: conversation.id, createdAt: at })
    return conversation
}

async function persist(message: UiMessage, conversation: StoredConversation) {
    try {
        await putMessage(toStored(message, conversation.id, conversation.userId))
        await useConversations().touch({ ...conversation, updatedAt: nowIso() })
        await queueOp({
            userId: conversation.userId,
            kind: 'message',
            id: message.id,
            conversationId: conversation.id,
            createdAt: message.createdAt,
        })
    }
    catch (err) {
        // The chat carries on in memory; it just won't survive a reload.
        logEvent(`saving message failed: ${err}`)
        console.error('[afronet] saving message failed:', err)
    }
}

/**
 * Conversation for the model: completed user/assistant pairs plus the new question.
 * Turns whose reply failed or came back empty are skipped so roles keep alternating.
 */
function buildHistory(question: string, hint?: { question: string, answer: string }): ChatMessage[] {
    // A related correction from the user's brain, as a fact the model should rely on.
    const system = hint
        ? `${SYSTEM_PROMPT}

Verified facts:
- When asked "${hint.question}", the correct answer is: ${hint.answer}`
        : SYSTEM_PROMPT
    const history: ChatMessage[] = [{ role: 'system', content: system }]
    const done = messages.value.slice(0, -2) // exclude the new user message + pending reply
    for (let i = 0; i + 1 < done.length; i++) {
        const user = done[i]!
        const reply = done[i + 1]!
        if (user.role === 'user' && reply.role === 'assistant' && reply.content.trim() && reply.status !== 'error') {
            history.push({ role: 'user', content: user.content }, { role: 'assistant', content: reply.content })
            i++
        }
    }
    history.push({ role: 'user', content: question })
    return history
}

/**
 * Asks a question. The user's brain is checked first: a question they already corrected gets their
 * answer back as-is (the model can't be trusted to repeat it — the brain test showed it often
 * sticks to what it believed), a related one passes the correction to the model as a fact.
 * `skipBrain` asks the model regardless ("Not what I asked").
 */
async function send(text: string, { skipBrain = false } = {}) {
    const question = text.trim()
    if (!question || generating.value) return

    const llm = useLLM()
    const conversation = await ensureConversation(question)

    const seq = nextSeq()
    const user: UiMessage = { id: newId(), seq, role: 'user', content: question, status: 'done', createdAt: nowIso() }
    const reply: UiMessage = { id: newId(), seq: seq + 1, role: 'assistant', content: '', status: 'streaming', createdAt: nowIso() }
    messages.value.push(user, reply)
    const live = messages.value.at(-1)! // reactive proxy
    if (conversation) await persist(user, conversation)

    generating.value = true
    controller = new AbortController()
    logEvent(`question sent (${question.length} chars, ${messages.value.length} messages in chat)`)
    const revealer = createRevealer((text) => { live.content += text })

    try {
        const match = skipBrain ? null : await useBrain().lookup(question)
        if (match?.kind === 'strong') {
            live.content = match.entry.answer
            live.source = 'brain'
            // The date shows how old the fact is; things like "who is president" go stale.
            const saved = new Date(match.entry.updatedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
            live.model = `From your brain · saved ${saved}`
            live.status = 'done'
            logEvent(`reply from brain (match ${match.score.toFixed(2)})`)
            return
        }

        const engine = llm.engine()
        live.model = llm.modelLabel()
        if (match) logEvent(`brain hint added (match ${match.score.toFixed(2)})`)
        const history = buildHistory(question, match?.entry)
        for await (const piece of engine.generate(history, { signal: controller.signal })) {
            revealer.push(piece)
        }
        // Stopped: show what was generated right away; otherwise let the typing finish smoothly.
        if (controller.signal.aborted) revealer.flush()
        else await revealer.finish()
        live.content = live.content.trim()
        live.status = controller.signal.aborted ? 'stopped' : 'done'
        live.stats = engine.lastStats ?? undefined
        const s = live.stats
        logEvent(`reply ${live.status}${s ? `: ${s.tokens} tokens, prompt ${s.promptTokens}, ${s.tokensPerSecond.toFixed(1)} tok/s` : ''}`)
    }
    catch (err) {
        revealer.flush()
        live.status = 'error'
        live.error = err instanceof Error ? err.message : String(err)
        logEvent(`reply error: ${live.error}`)
    }
    finally {
        generating.value = false
        controller = null
        // Timestamp the reply when it is finished, not when the empty bubble appeared.
        live.createdAt = nowIso()
        if (conversation) await persist({ ...live }, conversation)
        useChatSync().schedule()
        logAliveAfterReply()
    }
}

/** Re-asks the last question (used after an error or a stop). */
function retry() {
    const last = messages.value.at(-2)
    if (generating.value || last?.role !== 'user') return
    messages.value = messages.value.slice(0, -2)
    return send(last.content)
}

function stop() {
    controller?.abort()
}

/**
 * One-off import of the single chat kept by the previous build, so nothing a tester wrote is lost.
 */
async function importLegacyChat() {
    let saved: Array<{ role: 'user' | 'assistant', content: string, status?: string, model?: string }> = []
    try {
        saved = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '[]')
    }
    catch { return }
    if (!Array.isArray(saved) || saved.length === 0) {
        try { localStorage.removeItem(LEGACY_KEY) }
        catch { /* nothing to clean up */ }
        return
    }

    const { currentUserId, touch } = useConversations()
    const userId = currentUserId()
    if (!userId) return

    const first = saved.find(m => m.role === 'user')?.content ?? 'Earlier chat'
    const at = nowIso()
    const conversation: StoredConversation = {
        id: newId(), userId, title: titleFrom(first), createdAt: at, updatedAt: at, deletedAt: null,
    }
    await putConversation(conversation)
    await touch(conversation)

    let step = 0
    for (const m of saved) {
        if (!m?.content || (m.role !== 'user' && m.role !== 'assistant')) continue
        await putMessage({
            id: newId(),
            conversationId: conversation.id,
            userId,
            seq: step,
            role: m.role,
            content: m.content,
            status: 'done',
            model: m.model,
            // Keep the original order: stored timestamps are what sorts them.
            createdAt: new Date(Date.parse(at) + step++).toISOString(),
        })
    }
    try { localStorage.removeItem(LEGACY_KEY) }
    catch { /* best effort */ }
    logEvent(`imported ${step} messages from the previous single chat`)
}

export function useChat() {
    return {
        messages: readonly(messages),
        activeId: readonly(activeId),
        generating: readonly(generating),
        loadingConversation: readonly(loadingConversation),
        send,
        retry,
        stop,
        newChat,
        openConversation,
        importLegacyChat,
        clear: newChat,
    }
}
