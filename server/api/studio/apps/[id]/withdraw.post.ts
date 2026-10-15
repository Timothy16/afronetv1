// server/api/studio/apps/[id]/withdraw.post.ts
//
// Taking an app down: unpublished, or archived.
//
// The listing is suspended rather than deleted, which is what the confirmation promises the
// developer — people who already installed or bought it keep it, and their copy keeps working.
// Shipping a new version brings the listing back to life.
import { AfronetApp } from '../../../../models/AfronetApp.model'
import { AfronetDevApp } from '../../../../models/AfronetDevApp.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const { kind } = await readBody(event)

    if (!['unpublish', 'archive'].includes(kind)) {
        throw createError({ statusCode: 400, message: 'Unknown withdrawal' })
    }

    const build = await AfronetDevApp.findOne({ _id: id, userId: session.userId }).lean<any>()
    if (!build) throw createError({ statusCode: 404, message: 'Build not found' })

    if (build.storeAppId) {
        await AfronetApp.findByIdAndUpdate(build.storeAppId, { $set: { status: 'suspended' } })
    }

    const updated = await AfronetDevApp.findOneAndUpdate(
        { _id: id, userId: session.userId },
        { $set: { status: kind === 'unpublish' ? 'review_required' : 'archived', updatedAt: today() } },
        { new: true, lean: true },
    ) as any

    return { success: true, data: serializeAfronetDevApp(updated) }
})
