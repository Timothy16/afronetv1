// server/models/AfronetPwaStats.model.ts
import mongoose from 'mongoose'

// Single-document pattern. 'confirmed' holds installs that have passed the 3-hour
// delay window. 'pendingQueue' holds timestamps of recent installs not yet confirmed.
// On every stats read, entries older than 3 hours are atomically moved to 'confirmed'.
const AfronetPwaStatsSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true },
    confirmed: { type: Number, default: 0 },
    pendingQueue: { type: [Date], default: [] },
}, { timestamps: true })

export const AfronetPwaStats =
    mongoose.models.AfronetPwaStats ||
    mongoose.model('AfronetPwaStats', AfronetPwaStatsSchema)
