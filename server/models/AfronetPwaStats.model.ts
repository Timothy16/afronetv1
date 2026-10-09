// server/models/AfronetPwaStats.model.ts
import mongoose from 'mongoose'

// Single document pattern — one record with key 'global' holds the total install count.
const AfronetPwaStatsSchema = new mongoose.Schema({
    key: { type: String, default: 'global', unique: true },
    installs: { type: Number, default: 0 },
}, { timestamps: true })

export const AfronetPwaStats =
    mongoose.models.AfronetPwaStats ||
    mongoose.model('AfronetPwaStats', AfronetPwaStatsSchema)
