// server/api/apps/index.get.ts
//
// The store catalogue. Everything the browse screens need in one call: the listings are small,
// there are few of them, and the store's shelves are all slices of the same set — asking the
// server once and slicing on the device is both faster and simpler than nine queries.
//
// Suspended apps are included. Someone who already installed one still has it, and their copy
// has to keep showing the right name, version and the banner that explains the situation.
import { AfronetApp } from '../../models/AfronetApp.model'

const MAX_RESULTS = 500

export default defineEventHandler(async (event) => {
    await requireAfronetUser(event)
    await ensureMongo()

    // Nothing is seeded. An empty store means nobody has published yet, which is a real state
    // the browse screens handle, and it keeps every listing here one a developer actually made.
    const apps = await AfronetApp
        .find({})
        .sort({ updatedAt: -1 })
        .limit(MAX_RESULTS)
        .lean<any[]>()

    return { success: true, data: apps.map(serializeAfronetApp) }
})
