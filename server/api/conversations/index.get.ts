// server/api/conversations/index.get.ts
//
// The user's conversations, optionally only those changed since a given time — that is how a
// device catches up after being offline. Deleted ones are included (as tombstones) so the
// deletion reaches other devices.
import { AfronetConversation } from '../../models/AfronetConversation.model'

const MAX_RESULTS = 500

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const { since } = getQuery(event)
    const filter: Record<string, any> = { userId: session.userId }
    if (typeof since === 'string' && since) {
        const date = new Date(since)
        if (!Number.isNaN(date.getTime())) filter.updatedAt = { $gt: date }
    }

    const conversations = await AfronetConversation
        .find(filter)
        .sort({ updatedAt: -1 })
        .limit(MAX_RESULTS)
        .lean<any[]>()

    return { success: true, data: conversations.map(serializeConversation) }
})
