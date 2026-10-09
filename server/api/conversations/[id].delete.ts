// server/api/conversations/[id].delete.ts
//
// Soft delete, so the deletion can reach the user's other devices. The messages go for good.
import { AfronetConversation } from '../../models/AfronetConversation.model'
import { AfronetMessage } from '../../models/AfronetMessage.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = requireClientId(getRouterParam(event, 'id'), 'conversation id')
    const existing = await findOwnConversation(id, session.userId)
    if (!existing) throw createError({ statusCode: 404, message: 'Conversation not found' })

    const now = new Date()
    await AfronetConversation.updateOne({ _id: id }, { $set: { deletedAt: now, updatedAt: now } })
    await AfronetMessage.deleteMany({ conversationId: id, userId: session.userId })

    return { success: true, data: { id, deletedAt: now } }
})
