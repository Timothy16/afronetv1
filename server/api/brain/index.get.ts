// server/api/brain/index.get.ts
//
// The user's personal brain, optionally only what changed since a given time. Deleted entries are
// included (as tombstones) so the deletion reaches the user's other devices.
import { AfronetBrainEntry } from '../../models/AfronetBrainEntry.model'

const MAX_RESULTS = 2_000

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const { since } = getQuery(event)
    const filter: Record<string, any> = { userId: session.userId }
    if (typeof since === 'string' && since) {
        const date = new Date(since)
        if (!Number.isNaN(date.getTime())) filter.updatedAt = { $gt: date }
    }

    const entries = await AfronetBrainEntry
        .find(filter)
        .sort({ updatedAt: -1 })
        .limit(MAX_RESULTS)
        .lean<any[]>()

    return { success: true, data: entries.map(serializeBrainEntry) }
})
