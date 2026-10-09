// server/api/conversations/[id]/messages/[mid].put.ts
//
// Upload one finished message. Messages never change once written, so sending the same one twice
// is harmless — which is what makes retrying after a lost connection safe.
import { AfronetMessage } from '../../../../models/AfronetMessage.model'

const ROLES = ['user', 'assistant']
const STATUSES = ['done', 'stopped', 'error']

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const conversationId = requireClientId(getRouterParam(event, 'id'), 'conversation id')
    const id = requireClientId(getRouterParam(event, 'mid'), 'message id')
    const body = await readBody(event)

    const conversation = await findOwnConversation(conversationId, session.userId)
    if (!conversation) throw createError({ statusCode: 404, message: 'Conversation not found' })

    const role = String(body?.role ?? '')
    if (!ROLES.includes(role)) throw createError({ statusCode: 400, message: 'Invalid message role' })

    const status = String(body?.status ?? 'done')
    if (!STATUSES.includes(status)) throw createError({ statusCode: 400, message: 'Invalid message status' })

    const content = typeof body?.content === 'string' ? body.content : ''
    if (content.length > MAX_CONTENT_LENGTH) {
        throw createError({ statusCode: 413, message: 'Message is too long to store' })
    }

    const seq = Number(body?.seq)
    if (!Number.isInteger(seq) || seq < 0) throw createError({ statusCode: 400, message: 'Invalid message position' })

    const existing = await AfronetMessage.findById(id).lean<any>()
    if (existing) {
        // Already stored. Reject an id that belongs elsewhere; otherwise there is nothing to do.
        if (String(existing.userId) !== String(session.userId) || existing.conversationId !== conversationId) {
            throw createError({ statusCode: 409, message: 'This message id is already in use' })
        }
        return { success: true, data: serializeMessage(existing) }
    }

    const saved = await AfronetMessage.create({
        _id: id,
        conversationId,
        userId: session.userId,
        seq,
        role,
        content,
        status,
        model: cleanString(body?.model) || null,
        stats: body?.stats && typeof body.stats === 'object' ? body.stats : null,
        createdAt: clientDate(body?.createdAt),
    })

    return { success: true, data: serializeMessage(saved.toObject()) }
})
