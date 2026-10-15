// server/models/AfronetTokenBalance.model.ts
//
// How many tokens an account has left this week.
//
// One row per account, keyed by the account itself, so there can only ever be one balance and
// two requests arriving together cannot create a second.
//
// `renewedAt` is when the balance was last filled, not when it is next due. Renewal is worked
// out from it on the way past — if seven days have gone, the balance is set back to the weekly
// allowance. That means no scheduled job: a weekly cron is a thing that can quietly stop
// running, and nobody would find out until developers started reporting they got nothing.

import mongoose from 'mongoose'

const AfronetTokenBalanceSchema = new mongoose.Schema({
    /** The account's own id. One balance per account, by construction. */
    _id: { type: mongoose.Schema.Types.ObjectId, required: true },

    /** What is left to spend. Reset to the weekly allowance, never added to it. */
    balance: { type: Number, required: true },

    /** When it was last filled, as an ISO timestamp. */
    renewedAt: { type: String, required: true },

    /** What the allowance was at that moment, so a change to it can be read in context. */
    allowance: { type: Number, required: true },

    /** Total ever spent by this account. Not used for anything yet; cheap to keep, impossible to backfill. */
    spentAllTime: { type: Number, default: 0 },
}, {
    versionKey: false,
    timestamps: true,
})

export const AfronetTokenBalance =
    mongoose.models.AfronetTokenBalance ||
    mongoose.model('AfronetTokenBalance', AfronetTokenBalanceSchema)
