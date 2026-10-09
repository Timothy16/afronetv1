// server/api/conversations/[id].put.ts
//
// Create or update one conversation. Safe to send twice: the device's id is the key, so a retry
// after a failed connection cannot create a duplicate.
import { AfronetConversation } from '../../models/AfronetConversation.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = requireClientId(getRouterParam(event, 'id'), 'conversation id')
    const body = await readBody(event)

    const existing = await findOwnConversation(id, session.userId)

    const updatedAt = clientDate(body?.updatedAt)
    // Two devices can edit the same conversation while offline; the newer change wins.
    if (existing && new Date(existing.updatedAt) > updatedAt) {
        return { success: true, data: serializeConversation(existing) }
    }

    const title = cleanString(body?.title).slice(0, MAX_TITLE_LENGTH) || 'New chat'
    const deletedAt = body?.deletedAt ? clientDate(body.deletedAt) : null

    const saved = await AfronetConversation.findOneAndUpdate(
        { _id: id },
        {
            $set: { title, updatedAt, deletedAt },
            $setOnInsert: { userId: session.userId, createdAt: clientDate(body?.createdAt, updatedAt) },
        },
        { new: true, upsert: true, lean: true },
    )

    return { success: true, data: serializeConversation(saved) }
})
