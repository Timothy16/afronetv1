// server/api/conversations/[id]/messages/index.get.ts
//
// Every message of one conversation, oldest first — what a second device reads when the user
// opens a conversation it has never seen.
import { AfronetMessage } from '../../../../models/AfronetMessage.model'

const MAX_RESULTS = 1000

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = requireClientId(getRouterParam(event, 'id'), 'conversation id')
    const conversation = await findOwnConversation(id, session.userId)
    if (!conversation) throw createError({ statusCode: 404, message: 'Conversation not found' })

    const messages = await AfronetMessage
        .find({ conversationId: id, userId: session.userId })
        .sort({ seq: 1, createdAt: 1 })
        .limit(MAX_RESULTS)
        .lean<any[]>()

    return { success: true, data: messages.map(serializeMessage) }
})
