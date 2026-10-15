// scripts/brain-match-check.ts
//
// Measures the brain's question matching on the test questions, without the model or a phone.
// Run: node scripts/brain-match-check.ts
//
// For every item, its original question plays the saved correction. Then:
//   rewordings          should match (a miss is harmless: the model answers instead)
//   look-alikes         must NOT match strongly (that would show the wrong saved answer)
//   other items' questions  must NOT match strongly either

import { bestMatch } from '../app/lib/brainMatch.ts'
import { testItems } from '../app/data/brainTest.js'

const saved = testItems.map(i => ({ id: i.id, question: i.question }))
const tally = { reworded: { strong: 0, partial: 0, none: 0 }, lookalike: { strong: 0, partial: 0, none: 0 } }
const problems: string[] = []

for (const item of testItems) {
    for (const [kind, questions] of [['reworded', item.rewordings], ['lookalike', item.lookalikes]] as const) {
        for (const q of questions) {
            const match = bestMatch(q, saved)
            const result = match?.kind ?? 'none'
            // A rewording that matches another item's question is wrong, whatever its strength.
            const wrongItem = match && match.entry.id !== item.id
            if (kind === 'reworded') tally.reworded[wrongItem ? 'none' : result]++
            else tally.lookalike[result]++

            if (wrongItem && match.kind === 'strong') problems.push(`FALSE MATCH  "${q}"  →  "${match.entry.question}" (${match.score.toFixed(2)})`)
            else if (kind === 'lookalike' && match?.kind === 'strong') problems.push(`LOOK-ALIKE   "${q}"  →  "${match.entry.question}" (${match.score.toFixed(2)})`)
            else if (kind === 'reworded' && result === 'none') problems.push(`missed       "${q}"  (saved: "${item.question}")`)
        }
    }
}

const share = (n: number, of: number) => `${n}/${of} (${Math.round((n / of) * 100)}%)`
const r = tally.reworded
const l = tally.lookalike
const rTotal = r.strong + r.partial + r.none
const lTotal = l.strong + l.partial + l.none
console.log(`Rewordings   strong ${share(r.strong, rTotal)} · partial ${share(r.partial, rTotal)} · missed ${share(r.none, rTotal)}`)
console.log(`Look-alikes  strong ${share(l.strong, lTotal)} (must be 0) · partial ${share(l.partial, lTotal)} · none ${share(l.none, lTotal)}`)
console.log(problems.length ? `\n${problems.join('\n')}` : '\nNo problems.')
process.exitCode = problems.some(p => !p.startsWith('missed')) ? 1 : 0
