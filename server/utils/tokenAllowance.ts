// server/utils/tokenAllowance.ts
//
// What one account may spend on generating apps, counted in tokens.
//
// ─────────────────────────────────────────────────────────────────────────────
//  WEEKLY_ALLOWANCE is the number to change. Nothing else needs touching.
// ─────────────────────────────────────────────────────────────────────────────
//
// This replaced a count of generations — twenty a month, ten a day. Tokens are the thing
// actually being spent, so an allowance in tokens is one a developer can reason about: a
// bigger app costs more, which is true, and a count of apps never was.
//
// Two ideas keep it honest:
//
//   Reserve the ceiling, charge what was used. Nobody knows how long an app will be until it
//   has been written, so before generating, the balance has to cover the most a generation can
//   possibly take. Afterwards only the real cost is deducted. That way the check is exact and
//   a balance can never go negative — and a developer is told the worst case up front rather
//   than discovering it.
//
//   Renew on the way past. The balance is topped up when it is read and seven days have gone,
//   so there is no scheduled job to stop running.
//
// A failed generation still costs. The model did the work and we were billed for it, and the
// developer is told why it failed — that decision is the same one the old count made.

import { AfronetTokenBalance } from '../models/AfronetTokenBalance.model'

/** What every account is given, and given again each week. */
export const WEEKLY_ALLOWANCE = 20_000

/** How long a week is. Measured from an account's own last renewal, not a fixed day. */
export const RENEWAL_DAYS = 7

/**
 * A ceiling on output, which is the expensive half of a generation — around 98% of the cost.
 * 16,000 leaves room for a real app with several screens.
 *
 * It lives here rather than with the generator because the allowance has to reserve against
 * it, and the generator has to spend through the allowance. Keeping it in the generator made
 * the two files import each other, which is an error at startup rather than a design opinion.
 */
export const MAX_OUTPUT_TOKENS = 16_000

/**
 * The most a single generation can take.
 *
 * The output is capped, and the input is the system prompt plus the developer's description.
 * The description is bounded where it is read, so this is a real ceiling rather than a guess —
 * which is what makes reserving against it safe.
 */
/**
 * The longest a description may be, in characters.
 *
 * Roughly 550 tokens, which with the system prompt's 590 stays inside MAX_INPUT_TOKENS. This
 * is what turns the ceiling below into a real bound: without it an unbounded description
 * would make the input cost unbounded, and reserving against it would mean nothing.
 */
export const MAX_PROMPT_CHARS = 2_000

export const MAX_INPUT_TOKENS = 1_200
export const MAX_PER_GENERATION = MAX_INPUT_TOKENS + MAX_OUTPUT_TOKENS

const DAY_MS = 24 * 60 * 60 * 1000

export interface TokenState {
    balance: number
    allowance: number
    /** When the balance next goes back to the full allowance, as `2026-10-22`. */
    renewsOn: string
    /** The most one generation can take, which is what a balance has to cover. */
    maxPerGeneration: number
    /** Whether there is enough to start a generation at all. */
    enough: boolean
    /** Set when they cannot generate, in words they can act on. */
    blockedReason: string
}

const renewsOn = (renewedAt: string) =>
    new Date(Date.parse(renewedAt) + RENEWAL_DAYS * DAY_MS).toISOString().slice(0, 10)

/**
 * An account's balance, renewed if it is due and created if it has never existed.
 *
 * Every account reaches this the first time it opens Studio, which is how accounts that
 * existed before any of this came to have a balance.
 */
export async function balanceFor(userId: any, now = new Date()): Promise<TokenState> {
    const existing = await AfronetTokenBalance.findById(userId).lean<any>()

    const due = !existing || Date.parse(existing.renewedAt) + RENEWAL_DAYS * DAY_MS <= now.getTime()

    let balance = existing?.balance ?? 0
    let renewedAt = existing?.renewedAt ?? now.toISOString()

    if (due) {
        // Set to the allowance, never added to it. Someone who has not built anything for a
        // month gets this week's tokens, not a month of them.
        balance = WEEKLY_ALLOWANCE
        renewedAt = now.toISOString()

        await AfronetTokenBalance.findByIdAndUpdate(
            userId,
            {
                $set: { balance, renewedAt, allowance: WEEKLY_ALLOWANCE },
                $setOnInsert: { _id: userId, spentAllTime: 0 },
            },
            { upsert: true },
        )
    }

    const enough = balance >= MAX_PER_GENERATION

    return {
        balance,
        allowance: WEEKLY_ALLOWANCE,
        renewsOn: renewsOn(renewedAt),
        maxPerGeneration: MAX_PER_GENERATION,
        enough,
        blockedReason: enough
            ? ''
            : `You have ${balance.toLocaleString('en-GB')} tokens left, and building an app needs up to ${MAX_PER_GENERATION.toLocaleString('en-GB')}. Your allowance goes back to ${WEEKLY_ALLOWANCE.toLocaleString('en-GB')} on ${renewsOn(renewedAt)}.`,
    }
}

/** Refuses before anything is spent, and says when they can try again. */
export async function requireTokens(userId: any) {
    const state = await balanceFor(userId)
    if (!state.enough) {
        throw createError({ statusCode: 429, message: state.blockedReason, data: { tokens: state } })
    }
    return state
}

/**
 * Takes what a generation actually used.
 *
 * Floors at zero rather than going negative. The reservation should make that impossible, but
 * a balance that can go below nothing is one that has to be explained on a screen one day.
 */
export async function spendTokens(userId: any, tokens: number) {
    const used = Math.max(0, Math.round(tokens) || 0)
    if (!used) return

    const current = await AfronetTokenBalance.findById(userId).select('balance').lean<any>()
    const balance = Math.max(0, (current?.balance ?? WEEKLY_ALLOWANCE) - used)

    await AfronetTokenBalance.findByIdAndUpdate(
        userId,
        { $set: { balance }, $inc: { spentAllTime: used } },
        { upsert: false },
    )
}
