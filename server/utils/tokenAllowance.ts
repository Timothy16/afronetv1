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
export const WEEKLY_ALLOWANCE = 30_000

/** How long a week is. Measured from an account's own last renewal, not a fixed day. */
export const RENEWAL_DAYS = 7

/**
 * The most any one app may be, in output tokens.
 *
 * A backstop, not a budget. What each build actually gets is worked out by `budgetFor` from
 * what the plan estimated; this is the bound on a plan that comes back nonsense, and on how
 * long one call may run — 16,000 tokens already takes about two minutes.
 *
 * It is also a statement about what an Afronet app is: roughly 56,000 characters of HTML, a
 * large single file, running in a sandbox on a mid-range Android phone. Something that needs
 * more than this is not what the store is for.
 *
 * It lives here rather than with the generator because the allowance has to bound against it
 * and the generator has to spend through the allowance. Keeping it in the generator made the
 * two files import each other, which is an error at startup rather than a design opinion.
 */
export const MAX_OUTPUT_TOKENS = 16_000

/**
 * The longest a description may be, in characters.
 *
 * Roughly 550 tokens, which with the system prompt's 590 stays inside MAX_INPUT_TOKENS. This
 * is what turns the ceiling below into a real bound: without it an unbounded description
 * would make the input cost unbounded, and reserving against it would mean nothing.
 */
export const MAX_PROMPT_CHARS = 2_000

/**
 * A ceiling on input: the system prompt, the rules, the SDK reference and the description.
 *
 * Measured rather than guessed — check_tokens assembles the real prompt text from source and
 * fails if it will not fit, because every figure below is only a ceiling while this one is.
 * It was 1,200, which the SDK reference alone had already outgrown.
 */
export const MAX_INPUT_TOKENS = 1_800
export const MAX_PER_GENERATION = MAX_INPUT_TOKENS + MAX_OUTPUT_TOKENS

/**
 * The least room a build is ever given, when an estimate comes in low.
 *
 * Two different floors were one constant here, pulling opposite ways, and it took a working
 * build to show it. This one wants to be generous: headroom is free, because only what is
 * written is charged, and an estimate that falls short loses the whole attempt. A GPA
 * calculator was estimated at 4,800, handed 6,000, and cut off at exactly that.
 */
export const BUDGET_FLOOR = 9_000

/**
 * The least room that can still produce a working app, used to decide who may build at all.
 *
 * This one wants to be realistic rather than generous: set it high and developers who could
 * have built something are refused. The smallest app actually finished here came in at 5,918
 * output tokens, so 5,500 is the honest figure — just under it, never over.
 */
export const MIN_OUTPUT_TOKENS = 5_500

/** The least a balance can be and still be offered a smaller build. */
export const MIN_PER_GENERATION = MAX_INPUT_TOKENS + MIN_OUTPUT_TOKENS

/**
 * What it costs to ask the model what fits.
 *
 * Before building on a short balance a developer can have the description planned: the model
 * breaks it into what was asked for and says what each piece would take. That is a real call
 * and it comes out of their tokens, so it is bounded the same way a generation is — a capped
 * output, and an input bounded by the description.
 */
export const PLAN_MAX_OUTPUT_TOKENS = 800
export const PLAN_MAX_INPUT_TOKENS = 1_300
export const PLAN_MAX_PER_CALL = PLAN_MAX_INPUT_TOKENS + PLAN_MAX_OUTPUT_TOKENS

/**
 * The least a balance can be and still be offered a plan.
 *
 * Planning must never be what leaves someone unable to build. Below this they get the
 * description split mechanically instead, which costs nothing and tells them less.
 */
export const MIN_FOR_PLAN = MIN_PER_GENERATION + PLAN_MAX_PER_CALL

/**
 * How much the model is told it has, for one build.
 *
 * Three bounds, and the first is the one that matters:
 *
 *   What the plan estimated, with headroom. An estimate is approximate, so the build is given
 *   a quarter more than the top of the range rather than exactly it. This is what stops a
 *   small app being handed 16,000 tokens and writing until it is guillotined.
 *
 *   What the balance covers. The worst case is the balance itself and never more.
 *
 *   The ceiling, for a plan that came back nonsense.
 *
 * Without an estimate — no plan, or a plan that failed — it falls back to the balance and the
 * ceiling, which is the old behaviour and the riskier one.
 *
 * Zero means there is not enough to build anything worth having.
 */
/**
 * How much more than the estimate a build is given.
 *
 * 1.25 was thin for an estimator that has been wrong by a factor of two. The headroom is only
 * ever spent if the app needs it, so being generous here is close to free and being tight is
 * what loses an app.
 */
export const ESTIMATE_HEADROOM = 1.5

export function budgetFor(balance: number, estimateMax = 0) {
    const room = Math.floor(balance) - MAX_INPUT_TOKENS
    if (room < MIN_OUTPUT_TOKENS) return 0

    // A small app still gets the floor rather than its bare estimate. Headroom is free — only
    // what is actually written is charged — and running out is not.
    const wanted = estimateMax > 0
        ? Math.max(BUDGET_FLOOR, Math.ceil(estimateMax * ESTIMATE_HEADROOM))
        : MAX_OUTPUT_TOKENS

    return Math.min(room, wanted, MAX_OUTPUT_TOKENS)
}

const DAY_MS = 24 * 60 * 60 * 1000

export interface TokenState {
    balance: number
    allowance: number
    /** When the balance next goes back to the full allowance, as `2026-10-22`. */
    renewsOn: string
    /**
     * Whether this account can build at all: enough to have the description planned and still
     * build afterwards. There is no middle band any more — planning is part of building.
     */
    canBuild: boolean
    /** What planning costs them, at worst. Shown on the button before it is pressed. */
    planCost: number
    /**
     * The fixed cost of any build beyond the app itself: the rules, the SDK reference and the
     * description. Added to an estimate so the figure compared against a balance is the whole
     * of what will be spent.
     */
    overhead: number
    /** The most any one app may be. A backstop, and what the screen means by "too big". */
    ceiling: number
    /** The most a plan and a build could cost together, which is the true worst case. */
    maxPerGeneration: number
    /** Set when they cannot build, in words they can act on. */
    blockedReason: string
}


const renewsOn = (renewedAt: string) =>
    new Date(Date.parse(renewedAt) + RENEWAL_DAYS * DAY_MS).toISOString().slice(0, 10)

/**
 * Everything a screen needs, worked out from a balance.
 *
 * Separate from the lookup on purpose. This is the part with the decisions in it — whether a
 * full app is affordable, whether a smaller one is, whether a plan can be bought first — and
 * keeping it pure is what lets those decisions be run against every balance rather than
 * grepped for in the source. `balanceFor` does the database; this does the thinking.
 */
export function stateFor(balance: number, renewedAt: string): TokenState {
    const canBuild = balance >= MIN_FOR_PLAN
    const n = (value: number) => value.toLocaleString('en-GB')

    return {
        balance,
        allowance: WEEKLY_ALLOWANCE,
        renewsOn: renewsOn(renewedAt),
        canBuild,
        planCost: PLAN_MAX_PER_CALL,
        overhead: MAX_INPUT_TOKENS,
        ceiling: MAX_OUTPUT_TOKENS,
        maxPerGeneration: PLAN_MAX_PER_CALL + MAX_PER_GENERATION,
        blockedReason: canBuild
            ? ''
            : `You have ${n(balance)} tokens left, and building an app needs at least ${n(MIN_FOR_PLAN)} — ${n(PLAN_MAX_PER_CALL)} to work out what it takes, and ${n(MIN_PER_GENERATION)} to build it. Your allowance goes back to ${n(WEEKLY_ALLOWANCE)} on ${renewsOn(renewedAt)}.`,
    }
}


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

    return stateFor(balance, renewedAt)
}


/**
 * Refuses before anything is spent, and says when they can try again.
 *
 * One gate now, in front of both the plan and the build, because a build without a plan is
 * not something this flow does any more. It refuses only when neither is affordable.
 */
export async function requireTokens(userId: any) {
    const state = await balanceFor(userId)
    if (!state.canBuild) {
        throw createError({ statusCode: 429, message: state.blockedReason, data: { tokens: state } })
    }
    return state
}

/**
 * Takes what a call actually used.
 *
 * Floors at zero rather than going negative. The bounds should make that impossible, but a
 * balance that can go below nothing is one that has to be explained on a screen one day.
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
