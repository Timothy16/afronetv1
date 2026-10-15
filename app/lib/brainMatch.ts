// app/lib/brainMatch.ts
//
// Decides whether a new question is one the user already corrected. Plain keyword matching:
// works offline, needs no extra model, and is easy to reason about.
//
// Errs on the side of missing a match. A missed match only means the model answers as it would
// anyway; a false match shows a saved answer to a different question, which is worse than the
// mistake the brain exists to fix. Check changes with `node scripts/brain-match-check.ts`.

/** Same question: show the saved answer instead of asking the model. */
export const STRONG = 0.8
/** Related question: hand the saved answer to the model as a hint. */
export const PARTIAL = 0.5

/** Words that don't change what is being asked. Tense words (was, were) are kept on purpose. */
const STOPWORDS = new Set([
    'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'for', 'by', 'and', 'or',
    'is', 'are', 'who', 'what', 'which', 'whats', 'whos', 'where', 'how',
    'do', 'does', 'can', 'you', 'me', 'tell', 'please', 'i', 'know', 'name',
    'current', 'currently', 'now', 'today', 'present', 'right', 'presently', 'at', 'moment',
    'city', 'called', 'country', 'used',
])

/** Different spellings of the same thing. Longest phrases first. */
const SYNONYMS: Array<[RegExp, string]> = [
    [/\bunited states of america\b|\bunited states\b|\bu\.?s\.?a?\b|\bamerica\b/g, 'usa'],
    [/\bivory coast\b|\bcote d'?ivoire\b/g, 'cotedivoire'],
    [/\bunited kingdom\b|\bu\.?k\.?\b|\bbritain\b/g, 'uk'],
    [/\bafrican union\b|\bau\b/g, 'au'],
    [/\bafrica cup of nations\b|\bafcon\b/g, 'afcon'],
    [/\bheadquartered\b|\bheadquarters\b|\bhq\b/g, 'headquarters'],
    // "Who leads Ghana?" asks for the president. Prime ministers and chairpersons stay distinct.
    [/\bpresident\b|\bleads?\b|\bleader\b|\bheads?\b/g, 'leader'],
    [/\bmoney\b/g, 'currency'],
]

export function normalize(text: string) {
    let s = text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    for (const [pattern, replacement] of SYNONYMS) s = s.replace(pattern, replacement)
    return s
}

/** Content words of a question, possessives and punctuation removed. */
export function terms(text: string) {
    return new Set(
        normalize(text)
            .replace(/'s\b/g, '')
            .split(/[^a-z0-9]+/)
            .filter(w => w && !STOPWORDS.has(w)),
    )
}

const numbers = (set: Set<string>) => [...set].filter(w => /\d/.test(w)).sort().join(' ')

/**
 * 0–1: how much the two questions share (Jaccard over content words). Questions that mention
 * different numbers or years ("in 2010") never match — those are different questions.
 */
export function similarity(a: string, b: string) {
    const ta = terms(a)
    const tb = terms(b)
    if (!ta.size || !tb.size) return 0
    if (numbers(ta) !== numbers(tb)) return 0
    let shared = 0
    for (const w of ta) if (tb.has(w)) shared++
    return shared / (ta.size + tb.size - shared)
}

export type MatchKind = 'strong' | 'partial'

/** The best saved question for this one, if any is close enough. */
export function bestMatch<T extends { question: string }>(question: string, entries: readonly T[]) {
    let best: { entry: T, score: number } | null = null
    for (const entry of entries) {
        const score = similarity(question, entry.question)
        if (score > (best?.score ?? 0)) best = { entry, score }
    }
    if (!best || best.score < PARTIAL) return null
    return { ...best, kind: (best.score >= STRONG ? 'strong' : 'partial') as MatchKind }
}
