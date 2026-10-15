// server/utils/generateApp.ts
//
// Where an app's code comes from.
//
// One place calls the model, and the same place writes the ledger row, so a generation cannot
// happen without being accounted for. Everything downstream — the manifest, the checksum, the
// download, the sandbox — is unchanged by this; it only produces the files those act on.
//
// The call is made once. No retry, no fallback to something pre-written: a developer who asked
// for an email drafter and got a quiz was the old behaviour, and a silent retry would double
// the bill while hiding the failure that caused it.

import { AfronetAppGeneration } from '../models/AfronetAppGeneration.model'
import { SDK_RULES, withSdk } from './appSdk'
import { MAX_OUTPUT_TOKENS, spendTokens } from './tokenAllowance'

/** The model that writes the apps. Capable enough to one-shot a working app, cheap enough to ship on. */
export const GENERATION_MODEL = 'claude-sonnet-5-5'

/** USD per million tokens, for GENERATION_MODEL, as published. Used to price a row when it is written. */
const PRICE_PER_MTOK = { input: 2, output: 10 }

export function priceOf(inputTokens: number, outputTokens: number) {
    const usd = (inputTokens * PRICE_PER_MTOK.input + outputTokens * PRICE_PER_MTOK.output) / 1_000_000
    return Math.round(usd * 1e6) / 1e6
}

/** The sandbox an app has to survive, written as instructions rather than discovered by failing. */
const RULES = `Return ONE complete HTML document and nothing else. No explanation, no markdown fences, no commentary before or after.

The app runs in a locked-down frame, and one that breaks these rules will not run at all:
- Everything inline in the single file: no external scripts, stylesheets, fonts or images.
- No network requests of any kind. No fetch, no XMLHttpRequest, no WebSocket, no external URLs.
- No localStorage, sessionStorage or IndexedDB. They are unavailable here and throw when touched.
- The document must carry this exact meta tag in its head:
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; form-action 'none'; base-uri 'none'" />

${SDK_RULES}

Build what was asked for, working, not a mockup: real interaction, real state, sensible empty states, and nothing that pretends to do something it cannot.
Design for a phone first — the audience is Nigerian students on mid-range Android devices.`

/** The colour an app is themed in, matching the tone the developer picked in Studio. */
const TONES: Record<string, string> = {
    brand: '#0b5d3e',
    ink: '#121614',
    gold: '#b07f15',
    success: '#147a4c',
    danger: '#b22c26',
    muted: '#606863',
}

/** The developer's design choices, as instructions rather than template parameters. */
function styleNotes(config: any) {
    const notes = [`Use ${TONES[config?.tone] ?? TONES.brand} as the app's accent colour.`]
    if (config?.fontScale === 'large') notes.push('Use a larger base text size than usual — this app is set to large text.')
    if (config?.highContrast) notes.push('Use high-contrast text, readable in bright sunlight.')
    if (config?.saveProgress) {
        notes.push('This app saves what the user does. Use afronet.storage so their work is still there when they come back.')
    } else {
        notes.push('This app does not save anything between visits. Do not call afronet.storage, and do not imply that anything is kept.')
    }
    return notes.join('\n')
}

export interface GenerationResult {
    files: Record<string, string>
    usage: {
        model: string
        inputTokens: number
        outputTokens: number
        stopReason: string
        costUsd: number
        ms: number
    }
}

/**
 * Write an app from a description.
 *
 * Records the attempt either way — a call that reached the model and failed still costs, and a
 * ledger that only holds successes will not match the bill.
 */
export async function generateApp(opts: {
    prompt: string
    name: string
    config: any
    userId: any
    devAppId?: string
    kind?: 'create' | 'change'
}): Promise<GenerationResult> {
    const { claudeApiKey } = useRuntimeConfig()
    if (!claudeApiKey) {
        throw createError({ statusCode: 500, message: 'No Claude API key is configured on the server' })
    }

    const system = `You write small, self-contained web apps that run inside Afronet, a Nigerian student app.

${RULES}

${styleNotes(opts.config)}`

    const ask = `The app is called "${opts.name}".

What it should do, in the developer's own words:
${opts.prompt}`

    const started = Date.now()

    const record = async (row: any) => {
        // The tokens come off the balance here, beside the ledger row, so a generation cannot
        // be recorded without being charged for — including one that failed, which still cost
        // us the moment the model started writing.
        await spendTokens(opts.userId, (row.inputTokens ?? 0) + (row.outputTokens ?? 0))

        try {
            await AfronetAppGeneration.create({
                userId: opts.userId,
                devAppId: opts.devAppId ?? '',
                kind: opts.kind ?? 'create',
                model: GENERATION_MODEL,
                prompt: String(opts.prompt).slice(0, 2000),
                ms: Date.now() - started,
                ...row,
            })
        } catch {
            // A ledger write must never be what loses a developer their app. The row is for us;
            // the app is for them.
        }
    }

    let res: Response
    try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': claudeApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: GENERATION_MODEL,
                max_tokens: MAX_OUTPUT_TOKENS,
                system,
                messages: [{ role: 'user', content: ask }],
            }),
        })
    } catch (e: any) {
        // Never reached the model, so nothing was billed, but the attempt is worth knowing about.
        await record({ ok: false, stopReason: 'error', error: `could not reach the model: ${e?.message ?? e}` })
        throw createError({ statusCode: 502, message: 'Could not reach the model. Try again in a moment.' })
    }

    if (!res.ok) {
        const detail = (await res.text()).slice(0, 400)
        await record({ ok: false, stopReason: 'error', error: detail })
        throw createError({ statusCode: res.status, message: `The model refused the request: ${detail}` })
    }

    const result: any = await res.json()

    const inputTokens = result?.usage?.input_tokens ?? 0
    const outputTokens = result?.usage?.output_tokens ?? 0
    const stopReason = result?.stop_reason ?? 'unknown'
    const costUsd = priceOf(inputTokens, outputTokens)

    let html = (result?.content ?? [])
        .filter((part: any) => part?.type === 'text')
        .map((part: any) => part.text)
        .join('')
        .trim()

    // It is asked not to fence the output. If it does anyway, that is not worth a second call.
    html = html.replace(/^```(?:html)?\s*/i, '').replace(/\s*```$/, '').trim()

    // Afronet's own side of the bridge, added before anything is stored or hashed.
    html = withSdk(html)

    if (!/<html[\s>]/i.test(html)) {
        await record({ ok: false, inputTokens, outputTokens, costUsd, stopReason, error: 'no HTML document in the reply' })
        throw createError({ statusCode: 502, message: 'The app did not come back as a working document. Try describing it again.' })
    }

    // Truncated output is a half-written app. It is cheaper to say so than to ship it.
    if (stopReason === 'max_tokens') {
        await record({ ok: false, inputTokens, outputTokens, costUsd, stopReason, error: 'ran past the output ceiling' })
        throw createError({
            statusCode: 502,
            message: 'That app came out longer than the limit allows, so it was cut short. Try describing something smaller.',
        })
    }

    await record({ ok: true, inputTokens, outputTokens, costUsd, stopReason })

    return {
        files: { 'index.html': html },
        usage: { model: GENERATION_MODEL, inputTokens, outputTokens, stopReason, costUsd, ms: Date.now() - started },
    }
}
