// app/composables/useBrain.ts
//
// The personal brain: answers the user corrected, kept on this device per account. Separate from
// the model on purpose: switching or deleting a model never touches it.
//
// Local-first like the chats: every change is saved here at once and queued in the outbox, and
// useChatSync carries it to the account (African ID), so the brain comes back on a new device.

import { getBrainEntry, listBrain, newId, nowIso, putBrainEntry, queueOp, type BrainEntry } from '~/lib/chatStore'
import { bestMatch, STRONG } from '~/lib/brainMatch'
import { logEvent } from '~/lib/crashlog'

export const CATEGORIES = ['General', 'Politics & leaders', 'Geography', 'Money & business', 'Sports', 'Religion', 'Health', 'Science & technology', 'History'] as const

/** Words that point to a category. Order breaks ties: the more specific categories come first. */
const CATEGORY_HINTS: Array<[RegExp, (typeof CATEGORIES)[number]]> = [
    [/\b(pope|church|mosque|religion|religious|god|bible|quran|islam|muslim|christian|prayer|bishop|imam|catholic)\b/gi, 'Religion'],
    [/\b(health|disease|doctor|medicine|hospital|malaria|symptoms?|treatment|vaccine|nurse|clinic|pregnan\w*|fever)\b/gi, 'Health'],
    [/\b(won|wins?|cup|afcon|football|soccer|match|league|champions?|olympics?|team|player|coach|goals?)\b/gi, 'Sports'],
    [/\b(currency|money|price|cost|bank|business|company|market|economy|tax|invest\w*|naira|cedi|shilling|rand|dollar)\b/gi, 'Money & business'],
    [/\b(president|prime minister|minister|leaders?|leads|government|election|parliament|chairperson|king|queen|governor|senator|party|union|commission)\b/gi, 'Politics & leaders'],
    [/\b(science|technology|computer|phone|internet|software|physics|chemistry|biology|engineering)\b/gi, 'Science & technology'],
    [/\b(capital|city|cities|country|countries|river|mountain|lake|ocean|border|largest|population|continent|located|region)\b/gi, 'Geography'],
    [/\b(history|historical|founded|independence|colonial|ancient|century|war|empire|kingdom)\b/gi, 'History'],
]

/**
 * Picks the category from the question and the answer: the category with the most matching words
 * wins, and words in the question count double since they say what the correction is about.
 */
export function detectCategory(question: string, answer = '') {
    let best: (typeof CATEGORIES)[number] = 'General'
    let bestScore = 0
    for (const [pattern, category] of CATEGORY_HINTS) {
        const score = 2 * (question.match(pattern)?.length ?? 0) + (answer.match(pattern)?.length ?? 0)
        if (score > bestScore) { best = category; bestScore = score }
    }
    return best
}

const entries = ref<BrainEntry[]>([])
let loadedFor: string | null = null

async function load(force = false) {
    const userId = useConversations().currentUserId()
    if (!userId || (!force && loadedFor === userId)) return
    try {
        entries.value = await listBrain(userId)
        loadedFor = userId
    }
    catch (err) {
        logEvent(`brain could not be read: ${err}`)
    }
}

/**
 * Saves what the user says the answer should be. Correcting the same question again replaces the
 * earlier correction rather than adding a second, competing one.
 */
async function saveCorrection(question: string, answer: string) {
    const userId = useConversations().currentUserId()
    const q = question.trim()
    const a = answer.trim()
    if (!userId || !q || !a) return null
    await load()
    const category = detectCategory(q, a)

    const same = bestMatch(q, entries.value)
    const at = nowIso()
    const entry: BrainEntry = same && same.score >= STRONG
        ? { ...same.entry, question: q, answer: a, category, updatedAt: at }
        : { id: newId(), userId, question: q, answer: a, category, createdAt: at, updatedAt: at, deletedAt: null }

    await store(entry)
    logEvent(`brain: correction ${same && same.score >= STRONG ? 'updated' : 'saved'} (${category})`)
    return entry
}

/** Saves locally, shows it, and queues it for the account. */
async function store(entry: BrainEntry) {
    await putBrainEntry(entry)
    entries.value = entry.deletedAt
        ? entries.value.filter(e => e.id !== entry.id)
        : [entry, ...entries.value.filter(e => e.id !== entry.id)]
    await queueOp({ userId: entry.userId, kind: 'brain', id: entry.id, createdAt: entry.updatedAt })
    useChatSync().schedule()
}

/** Edits a correction from the My brain panel. */
async function update(id: string, changes: { question: string, answer: string }) {
    const entry = await getBrainEntry(id)
    const question = changes.question.trim()
    const answer = changes.answer.trim()
    if (!entry || !question || !answer) return
    await store({ ...entry, question, answer, category: detectCategory(question, answer), updatedAt: nowIso() })
    logEvent('brain: correction edited')
}

/** Soft delete, so the deletion reaches the user's other devices. */
async function remove(id: string) {
    const entry = await getBrainEntry(id)
    if (!entry) return
    const at = nowIso()
    await store({ ...entry, deletedAt: at, updatedAt: at })
    logEvent('brain: correction deleted')
}

/** Sign-out: nothing of the previous account stays in memory. */
function reset() {
    entries.value = []
    loadedFor = null
}

/** The saved correction for this question: 'strong' answers it, 'partial' only hints. */
async function lookup(question: string) {
    await load()
    return bestMatch(question, entries.value)
}

export function useBrain() {
    return {
        entries: readonly(entries),
        load,
        saveCorrection,
        update,
        remove,
        reset,
        lookup,
    }
}
