// app/lib/markdown.ts
//
// Minimal Markdown → HTML for model replies: paragraphs, headings, lists, code, bold/italic.
// Everything is HTML-escaped first, so the output is safe for v-html. Tolerates partial
// (still-streaming) input.
//
// Lists get special care. Small models write them in ways a strict parser mishandles:
//   - a blank line between every item (which used to start a new list, so every item showed "1.")
//   - numbering that starts somewhere other than 1
//   - an item whose text wraps onto an indented second line
// So a blank line only ends a list if what follows is not another item of the same kind, the
// first number is carried into the <ol>, and an indented line continues the item above it.

const ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' }
const escape = (s: string) => s.replace(/[&<>"']/g, c => ESCAPES[c]!)

function inline(s: string) {
    return escape(s)
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
}

const BULLET = /^\s*[-*•]\s+(.*)$/
const NUMBERED = /^\s*(\d+)[.)]\s+(.*)$/
/** A wrapped line belonging to the item above: indented, and not itself an item. */
const CONTINUATION = /^\s{2,}\S/

interface OpenList {
    tag: 'ul' | 'ol'
    /** The model's own first number, so a list starting at 3 is not renumbered to 1. */
    start: number
    items: string[]
}

export function renderMarkdown(src: string): string {
    const lines = src.replace(/\r\n/g, '\n').split('\n')
    const out: string[] = []
    let para: string[] = []
    let list = null as OpenList | null
    /** A blank line that may turn out to sit between two items of the same list. */
    let pendingBlank = false

    const flushPara = () => {
        if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`)
        para = []
    }

    const flushList = () => {
        if (list) {
            const attr = list.tag === 'ol' && list.start !== 1 ? ` start="${list.start}"` : ''
            out.push(`<${list.tag}${attr}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`)
        }
        list = null
        pendingBlank = false
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]!

        if (line.trimStart().startsWith('```')) {
            flushPara(); flushList()
            const code: string[] = []
            while (++i < lines.length && !lines[i]!.trimStart().startsWith('```')) code.push(lines[i]!)
            out.push(`<pre><code>${escape(code.join('\n'))}</code></pre>`)
            continue
        }

        const heading = line.match(/^(#{1,6})\s+(.*)$/)
        if (heading) {
            flushPara(); flushList()
            const level = Math.min(heading[1]!.length + 2, 6) // keep headings small inside replies
            out.push(`<h${level}>${inline(heading[2]!)}</h${level}>`)
            continue
        }

        const bullet = line.match(BULLET)
        const numbered = line.match(NUMBERED)
        if (bullet || numbered) {
            flushPara()
            const tag = bullet ? 'ul' : 'ol'
            const text = bullet ? bullet[1]! : numbered![2]!
            // A blank line between two items of the same kind is spacing, not the end of the list.
            if (list && list.tag !== tag) flushList()
            if (!list) list = { tag, start: numbered ? Number(numbered[1]) : 1, items: [] }
            list.items.push(text)
            pendingBlank = false
            continue
        }

        if (!line.trim()) {
            // Hold the decision: the next line says whether the list continues.
            if (list) pendingBlank = true
            else flushPara()
            continue
        }

        // An indented line right after an item is the rest of that item.
        if (list && !pendingBlank && CONTINUATION.test(line)) {
            list.items[list.items.length - 1] += ` ${line.trim()}`
            continue
        }

        flushList()
        para.push(line)
    }

    flushPara(); flushList()
    return out.join('')
}
