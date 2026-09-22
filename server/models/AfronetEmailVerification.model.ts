// server/models/AfronetEmailVerification.model.ts
import mongoose from 'mongoose'

// One pending sign-up verification per email. The raw token only ever lives in
// the emailed link; we store its sha256 hash.
const AfronetEmailVerificationSchema = new mongoose.Schema({
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    token: { type: String, required: true, unique: true }, // sha256(rawToken)
    verified: { type: Boolean, default: false },

    // TTL index: Mongo removes the record on its own once it expires
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true })

export const AfronetEmailVerification =
    mongoose.models.AfronetEmailVerification ||
    mongoose.model('AfronetEmailVerification', AfronetEmailVerificationSchema)
