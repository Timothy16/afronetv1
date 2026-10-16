// server/utils/planApp.ts
//
// What an app would take to build, before it is built.
//
// The question this answers is not "how many tokens will this be" — nothing can answer that,
// and eight rows of history cannot either. It is "here is this much room; what can you build
// completely in it, and what should they drop". That is a planning question, and the thing
// answering it is the same model, with the same budget, that then writes the app. Its estimate
// is of its own forthcoming work rather than a stranger's guess at it.
//
// Two rules make it worth trusting:
//
//   It quotes. Every feature comes back as the developer's own words, so a tick list cannot
//   become a description they never wrote. Anything that comes back reworded is dropped.
//
//   It ranges. A single figure gets believed as precise and this is not precise. A range
//   carries its own uncertainty, and the estimate is recorded beside the real cost afterwards
//   so the system can be asked how often it was right.
//
// Charged to the developer, like any other call. Bounded like one too.

import { AfronetAppGeneration } from '../models/AfronetAppGeneration.model'
import { GENERATION_MODEL, priceOf } from './generateApp'
import { PLAN_MAX_OUTPUT_TOKENS, spendTokens } from './tokenAllowance'

/** What the planner is told. Kept short: every character of it is paid for by a developer. */
const PLAN_RULES = `You are planning a small self-contained web app before writing it. It will be one HTML file, everything inline, running in a locked-down frame with no network.

Break the developer's description into the separate things they asked for, and say what each would cost you to write properly.

Rules:
- Quote the developer. Each item must be their own words, copied from the description. You may leave words out; you may not add any or reword them.
- Do not invent anything they did not ask for, and do not merge two separate asks into one.
- The first item is usually the app itself rather than a feature. List it, costed as the shell: the page, the layout, the styling, the empty state.
- Estimate output tokens, as a range, where one token is about 3.5 characters of code.

Be realistic, and err high. Working apps of this kind have come in between 5,900 and 12,900 output tokens, most around 9,000. The page shell alone — layout, styling, headings, empty states, a responsive phone-first design — is 2,500 to 4,000 before a single feature. A feature that holds a list, renders it, saves it and lets it be edited is 1,500 to 3,000 on its own.

An estimate that is too low is far worse than one that is too high: the build is given that much room, runs out, and the whole app is lost.

Return ONLY a JSON array and nothing else. No prose, no markdown fences.
[{"text":"their words here","min":0,"max":0}]`

export interface PlannedFeature {
    id: string
    text: string
    min: number
    max: number
}

export interface PlanResult {
    features: PlannedFeature[]
    planId: string
    usage: { inputTokens: number; outputTokens: number; costUsd: number; ms: number }
}

/**
 * Whether a feature is really the developer's words.
 *
 * Word-for-word is too strict — the model drops filler and changes a plural. Every word being
 * one they used is the test that matters, because it is the one that stops a feature being
 * invented. A reworded item is dropped rather than shown.
 */
function quotesTheDeveloper(text: string, prompt: string) {
    const words = prompt.toLowerCase().match(/[a-z0-9']+/g) ?? []
    const known = new Set(words)
    const used = text.toLowerCase().match(/[a-z0-9']+/g) ?? []
    if (!used.length) return false
    return used.every((w) => known.has(w))
}

/** Plan a description. Charged whether or not the developer goes on to build. */
export async function planApp(opts: { prompt: string; name: string; userId: any }): Promise<PlanResult> {
    const { claudeApiKey } = useRuntimeConfig()
    if (!claudeApiKey) {
        throw createError({ statusCode: 500, message: 'No Claude API key is configured on the server' })
    }

    const started = Date.now()

    // Same rule as a generation: the row always records what we were billed, and `charged`
    // records whether the developer paid it. A plan we could not read is not their mistake.
    const record = async (row: any, charge = true) => {
        const used = (row.inputTokens ?? 0) + (row.outputTokens ?? 0)
        if (charge) await spendTokens(opts.userId, used)

        try {
            return await AfronetAppGeneration.create({
                userId: opts.userId,
                kind: 'plan',
                model: GENERATION_MODEL,
                prompt: String(opts.prompt).slice(0, 2000),
                ms: Date.now() - started,
                charged: charge ? used : 0,
                ...row,
            })
        } catch {
            // The plan is for the developer; the row is for us.
            return null
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
                max_tokens: PLAN_MAX_OUTPUT_TOKENS,
                system: PLAN_RULES,
                messages: [
                    {
                        role: 'user',
                        content: `The app is called "${opts.name}".\n\nWhat it should do, in the developer's own words:\n${opts.prompt}`,
                    },
                ],
            }),
        })
    } catch (e: any) {
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
    const costUsd = priceOf(inputTokens, outputTokens)

    let text = (result?.content ?? [])
        .filter((part: any) => part?.type === 'text')
        .map((part: any) => part.text)
        .join('')
        .trim()

    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    let raw: any
    try {
        raw = JSON.parse(text)
    } catch {
        // The array is sometimes wrapped in a sentence despite being asked for on its own.
        const from = text.indexOf('[')
        const to = text.lastIndexOf(']')
        try {
            raw = from >= 0 && to > from ? JSON.parse(text.slice(from, to + 1)) : null
        } catch {
            raw = null
        }
    }

    if (!Array.isArray(raw) || !raw.length) {
        await record({ ok: false, inputTokens, outputTokens, costUsd, stopReason: result?.stop_reason ?? 'unknown', error: 'the plan did not come back as a list' }, false)
        throw createError({
            statusCode: 502,
            message: 'The plan did not come back in a usable shape. You have not been charged for a build — try again, or trim the description yourself.',
        })
    }

    const features: PlannedFeature[] = []
    for (const item of raw) {
        const featureText = String(item?.text ?? '').trim()
        if (!featureText || !quotesTheDeveloper(featureText, opts.prompt)) continue

        const min = Math.max(0, Math.round(Number(item?.min) || 0))
        const max = Math.max(min, Math.round(Number(item?.max) || 0))
        if (!max) continue

        features.push({ id: `f${features.length}`, text: featureText, min, max })
    }

    if (!features.length) {
        await record({ ok: false, inputTokens, outputTokens, costUsd, stopReason: result?.stop_reason ?? 'unknown', error: 'nothing in the plan quoted the description' }, false)
        throw createError({
            statusCode: 502,
            message: 'The plan came back describing an app you did not ask for, so it has been discarded. Trim the description yourself instead.',
        })
    }

    // Stored against the plan, not taken from the browser later: the estimate has to be ours
    // if comparing it with the real cost is going to mean anything.
    const row = await record({
        ok: true,
        inputTokens,
        outputTokens,
        costUsd,
        stopReason: result?.stop_reason ?? 'unknown',
        estimateMin: features.reduce((n, f) => n + f.min, 0),
        estimateMax: features.reduce((n, f) => n + f.max, 0),
    })

    return {
        features,
        planId: row?._id ? String(row._id) : '',
        usage: { inputTokens, outputTokens, costUsd, ms: Date.now() - started },
    }
}
