// server/models/AfronetBrainEntry.model.ts
import mongoose from 'mongoose'

/**
 * One correction in a user's personal brain: the question, and the answer the user says is right.
 * Same rules as conversations: the id is a uuid from the device, timestamps come from the device,
 * the newer updatedAt wins between devices, and deletion is a soft delete so it reaches the
 * user's other devices.
 */
const AfronetBrainEntrySchema = new mongoose.Schema({
    _id: { type: String, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true },

    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: { type: String, default: 'General' },

    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },
    deletedAt: { type: Date, default: null },
}, { timestamps: false, versionKey: false })

// The sync pull asks for "everything of mine changed since X".
AfronetBrainEntrySchema.index({ userId: 1, updatedAt: -1 })

export const AfronetBrainEntry =
    mongoose.models.AfronetBrainEntry ||
    mongoose.model('AfronetBrainEntry', AfronetBrainEntrySchema)
