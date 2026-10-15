// server/models/AfronetAppReview.model.ts
//
// What someone thought of an app.
//
// One per account per app, which is why the key is built from the pair: writing again edits
// what you said rather than adding a second voice. That is the difference between a rating
// and a vote count anyone can stuff.
//
// There were three kinds once: a review, a bug report and a feature request. Sharing one row
// meant filing a bug replaced the review someone had already written and took their stars out
// of the average with it — and both were messages to a developer with nowhere to read them.
//
// Now there is one. The kind field stays, always "review", so rows written before this keep
// working and the average keeps ignoring anything that is not one. Bug reports return when
// there is a developer inbox for them to arrive in.

import mongoose from 'mongoose'

const AfronetAppReviewSchema = new mongoose.Schema({
    /** `<userId>:<appId>` — one row per pair, enforced by the key itself. */
    _id: { type: String, required: true },

    appId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true, index: true },

    /** "Ada O." — how it is signed. A full name is never published. */
    author: { type: String, required: true },

    /** 1–5. */
    rating: { type: Number, min: 1, max: 5, required: true },

    /** Always "review". Kept so rows written before the other two were dropped still count. */
    kind: { type: String, default: 'review', index: true },

    body: { type: String, default: '' },

    /** They paid for it. Shown beside the review, because it is worth knowing. */
    verified: { type: Boolean, default: false },

    /** The version they were using, so an old complaint can be read in context. */
    version: { type: String, default: '' },

    /** The developer's answer, if they have given one. */
    reply: { type: String, default: '' },
}, {
    versionKey: false,
    timestamps: true,
})

// The app page asks for one app's reviews, newest first, every time it opens.
AfronetAppReviewSchema.index({ appId: 1, createdAt: -1 })

export const AfronetAppReview =
    mongoose.models.AfronetAppReview ||
    mongoose.model('AfronetAppReview', AfronetAppReviewSchema)
