// server/models/AfronetMessage.model.ts
import mongoose from 'mongoose'

/**
 * One turn of a conversation. Device-generated uuid id, and only ever written once: a message is
 * stored after it is finished, never while it streams. That makes syncing append-only, so there
 * is nothing to merge and no conflict to resolve.
 */
const AfronetMessageSchema = new mongoose.Schema({
    _id: { type: String, required: true },

    conversationId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true },

    /** Position in the conversation; questions and replies can share a timestamp. */
    seq: { type: Number, required: true },

    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, default: '' },
    status: { type: String, enum: ['done', 'stopped', 'error'], default: 'done' },

    /** Which model wrote an assistant reply, e.g. "SmolLM2 360M". */
    model: { type: String, default: null },
    /** Speed/size figures for support and quality work. */
    stats: { type: Object, default: null },

    createdAt: { type: Date, required: true },
}, { timestamps: false, versionKey: false })

AfronetMessageSchema.index({ conversationId: 1, seq: 1 })

export const AfronetMessage =
    mongoose.models.AfronetMessage ||
    mongoose.model('AfronetMessage', AfronetMessageSchema)
