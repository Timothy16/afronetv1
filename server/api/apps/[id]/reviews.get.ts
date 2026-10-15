// server/api/apps/[id]/reviews.get.ts
//
// One app's reviews, newest first.
//
// `mine` is marked on the way out so the screen can offer "edit yours" rather than letting
// someone write a second one and wondering why it replaced the first.
import { AfronetAppReview } from '../../../models/AfronetAppReview.model'

const MAX_RESULTS = 200

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')

    const rows = await AfronetAppReview
        .find({ appId: id })
        .sort({ createdAt: -1 })
        .limit(MAX_RESULTS)
        .lean<any[]>()

    return {
        success: true,
        data: rows.map((r) => ({
            id: r._id,
            appId: r.appId,
            author: r.author,
            rating: r.rating,
            body: r.body ?? '',
            verified: Boolean(r.verified),
            version: r.version ?? '',
            reply: r.reply ?? '',
            date: (r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt ?? '')).slice(0, 10),
            mine: String(r.userId) === String(session.userId),
        })),
    }
})
