// server/models/AfronetAppReport.model.ts
//
// Someone telling Afronet that something is wrong with an app or a review.
//
// This existed as a dialog that answered "Report submitted · reference AFN-RPT-2219" — the
// same reference every time — and kept nothing. A person reporting an app for a real reason
// was told it had been received when nobody would ever see it.
//
// A report is kept whether or not anyone is reading them yet. The queue can come later; the
// record cannot be written retrospectively.

import mongoose from 'mongoose'

const AfronetAppReportSchema = new mongoose.Schema({
    _id: { type: String, required: true },

    /** Who reported it. Kept so a pattern of reports from one account can be seen. */
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true, index: true },

    /** What was reported: a listing id, or free text naming a review. */
    subject: { type: String, required: true },
    /** app | review */
    kind: { type: String, default: 'app', index: true },

    reason: { type: String, required: true },
    details: { type: String, default: '' },

    /** The reference the person is shown, so they can quote it. */
    reference: { type: String, required: true, unique: true },

    /** open | reviewing | closed */
    status: { type: String, default: 'open', index: true },
}, {
    versionKey: false,
    timestamps: true,
})

export const AfronetAppReport =
    mongoose.models.AfronetAppReport ||
    mongoose.model('AfronetAppReport', AfronetAppReportSchema)
