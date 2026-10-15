// server/utils/generationQuota.ts
//
// What one account may spend on generating apps.
//
// Enforced now rather than when the app ships, because a limit added later is a limit that has
// never been tested: the screens that explain it, the refusal, and the counting all have to
// work before anyone trusts them with a card.
//
// Two limits, doing two different jobs:
//
//   The monthly allowance is the product decision — what a developer gets.
//   The daily ceiling is a fuse. A loop in a component can call an endpoint hundreds of times
//   before anyone notices, and at roughly eight cents a generation that is a real bill. The
//   fuse bounds a bad day; the allowance bounds a good one.
//
// Both count attempts that reached the model, successful or not, because both were paid for.

import { AfronetAppGeneration } from '../models/AfronetAppGeneration.model'

export const MONTHLY_LIMIT = 20
export const DAILY_LIMIT = 10

/** The first instant of the month and of the day, in UTC, for the period a row is counted in. */
function periodStarts(now: Date) {
    return {
        month: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
        day: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
    }
}

export interface QuotaState {
    /** When the monthly allowance comes back, as `2026-11-01`. */
    resetsOn: string
    monthUsed: number
    monthLimit: number
    monthRemaining: number
    dayUsed: number
    dayLimit: number
    monthCostUsd: number
    /** Set when the account may not generate right now, and why, in words a developer can act on. */
    blockedReason: string
}

/**
 * What this account has used, and whether it may generate again.
 *
 * Attempts that never reached the model — a missing key, a network failure — are not counted,
 * because nothing was spent on them and a developer should not lose an allowance to our outage.
 */
export async function quotaFor(userId: any, now = new Date()): Promise<QuotaState> {
    const { month, day } = periodStarts(now)

    const billable = { userId, $or: [{ ok: true }, { stopReason: { $ne: 'error' } }] }

    const [monthRows, dayUsed] = await Promise.all([
        AfronetAppGeneration.find({ ...billable, createdAt: { $gte: month } })
            .select('costUsd')
            .lean<any[]>(),
        AfronetAppGeneration.countDocuments({ ...billable, createdAt: { $gte: day } }),
    ])

    const monthUsed = monthRows.length
    const monthCostUsd = Math.round(monthRows.reduce((sum, r) => sum + (r.costUsd ?? 0), 0) * 1e6) / 1e6

    let blockedReason = ''
    if (monthUsed >= MONTHLY_LIMIT) {
        blockedReason = `You have used all ${MONTHLY_LIMIT} of this month's app generations. They reset at the start of next month.`
    } else if (dayUsed >= DAILY_LIMIT) {
        blockedReason = `You have generated ${DAILY_LIMIT} apps today, which is the daily limit. Try again tomorrow.`
    }

    // The first of next month, in UTC, which is the boundary the count itself uses.
    const resetsOn = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
        .toISOString()
        .slice(0, 10)

    return {
        resetsOn,
        monthUsed,
        monthLimit: MONTHLY_LIMIT,
        monthRemaining: Math.max(0, MONTHLY_LIMIT - monthUsed),
        dayUsed,
        dayLimit: DAILY_LIMIT,
        monthCostUsd,
        blockedReason,
    }
}

/** Refuses before anything is spent. Returns the state so a caller can report what is left. */
export async function requireQuota(userId: any) {
    const quota = await quotaFor(userId)
    if (quota.blockedReason) {
        throw createError({ statusCode: 429, message: quota.blockedReason, data: { quota } })
    }
    return quota
}
