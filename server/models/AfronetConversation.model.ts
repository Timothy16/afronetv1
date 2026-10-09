// server/models/AfronetConversation.model.ts
import mongoose from 'mongoose'

/**
 * A chat thread. The id is a uuid generated on the user's device, so a conversation started
 * offline keeps the same id when it reaches the server and can never be uploaded twice.
 *
 * Timestamps come from the device rather than Mongo: a conversation can be created and edited
 * with no connection, and the device's own times are what order it. Conflicts between devices
 * are settled by the newer updatedAt.
 */
const AfronetConversationSchema = new mongoose.Schema({
    _id: { type: String, required: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'AfronetUser', required: true },

    title: { type: String, default: 'New chat', trim: true },

    createdAt: { type: Date, required: true },
    updatedAt: { type: Date, required: true },

    /** Soft delete, so the deletion reaches the user's other devices. */
    deletedAt: { type: Date, default: null },
}, { timestamps: false, versionKey: false })

// The sync pull asks for "everything of mine changed since X".
AfronetConversationSchema.index({ userId: 1, updatedAt: -1 })

export const AfronetConversation =
    mongoose.models.AfronetConversation ||
    mongoose.model('AfronetConversation', AfronetConversationSchema)
