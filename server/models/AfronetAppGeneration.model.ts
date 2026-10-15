// server/models/AfronetAppGeneration.model.ts
//
// One row per time the model was asked to write an app. The ledger behind the quota, and the
// thing that has to agree with the Console's bill.
//
// Rows rather than a counter on the account, for three reasons:
//
//   A counter can only say how many. Rows say which prompts were expensive, which is what
//   decides what the quota should actually be.
//
//   Cost is frozen when the row is written. Prices change; a stored figure stays true, while a
//   recomputed one quietly rewrites history.
//
//   A failed generation still costs money if the model had already started writing. Those rows
//   are kept too, or the books will not match the Console.

import mongoose from 'mongoose'

const AfronetAppGenerationSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true, index: true },

    /** The build this was for. Empty for a generation that never got as far as a build. */
    devAppId: { type: String, default: '', index: true },

    /** create | change — what the call was for. */
    kind: { type: String, default: 'create' },

    model: { type: String, required: true },

    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },

    /**
     * What this call cost, in US dollars, at the rates in force when it ran. Stored to six
     * decimal places because a single generation is measured in cents.
     */
    costUsd: { type: Number, default: 0 },

    /** end_turn | max_tokens | error — how the call finished. */
    stopReason: { type: String, default: '' },

    /** Set when the call failed, so a refusal can be told from a truncation. */
    error: { type: String, default: '' },

    ok: { type: Boolean, default: true },

    /** How long the call took, in milliseconds. */
    ms: { type: Number, default: 0 },

    /** The description that was asked for, trimmed. Kept so an expensive row can be read back. */
    prompt: { type: String, default: '' },
}, {
    versionKey: false,
    timestamps: true,
})

// The quota asks the same question every time: what has this account spent this period?
AfronetAppGenerationSchema.index({ userId: 1, createdAt: -1 })

export const AfronetAppGeneration =
    mongoose.models.AfronetAppGeneration ||
    mongoose.model('AfronetAppGeneration', AfronetAppGenerationSchema)
