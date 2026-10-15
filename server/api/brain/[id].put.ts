// server/api/brain/[id].put.ts
//
// Create, update or delete (soft) one correction in the user's personal brain. Safe to send
// twice: the device's id is the key. Between devices, the newer change wins.
import { AfronetBrainEntry } from '../../models/AfronetBrainEntry.model'

const MAX_QUESTION_LENGTH = 2_000
const MAX_CATEGORY_LENGTH = 60

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = requireClientId(getRouterParam(event, 'id'), 'brain entry id')
    const body = await readBody(event)

    const existing = await AfronetBrainEntry.findById(id).lean<any>()
    // Someone else's id: answer exactly as for an unknown one.
    if (existing && String(existing.userId) !== String(session.userId)) {
        throw createError({ statusCode: 404, message: 'Brain entry not found' })
    }

    const updatedAt = clientDate(body?.updatedAt)
    if (existing && new Date(existing.updatedAt) > updatedAt) {
        return { success: true, data: serializeBrainEntry(existing) }
    }

    const question = cleanString(body?.question)
    const answer = cleanString(body?.answer)
    if (!question || !answer) throw createError({ statusCode: 400, message: 'A question and an answer are required' })
    if (question.length > MAX_QUESTION_LENGTH || answer.length > MAX_CONTENT_LENGTH) {
        throw createError({ statusCode: 413, message: 'This correction is too long to store' })
    }

    const saved = await AfronetBrainEntry.findOneAndUpdate(
        { _id: id },
        {
            $set: {
                question,
                answer,
                category: cleanString(body?.category).slice(0, MAX_CATEGORY_LENGTH) || 'General',
                updatedAt,
                deletedAt: body?.deletedAt ? clientDate(body.deletedAt) : null,
            },
            $setOnInsert: { userId: session.userId, createdAt: clientDate(body?.createdAt, updatedAt) },
        },
        { new: true, upsert: true, lean: true },
    )

    return { success: true, data: serializeBrainEntry(saved) }
})
