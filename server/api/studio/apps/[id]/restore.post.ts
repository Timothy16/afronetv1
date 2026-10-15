// server/api/studio/apps/[id]/restore.post.ts
//
// Bringing an archived app back to the developer's list.
//
// Archiving promised this in so many words — "can't be published until you restore them" —
// and there was no way to restore anything. An app could be archived and never recovered.
//
// It comes back to where it was before, not to the store: a build that still has code and a
// passing test is ready to submit again, one that does not is a draft. The listing stays
// suspended until they publish it, because restoring something to your own list is not the
// same as putting it back in front of people.
import { AfronetDevApp } from '../../../../models/AfronetDevApp.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')

    const build = await AfronetDevApp.findOne({ _id: id, userId: session.userId }).lean<any>()
    if (!build) throw createError({ statusCode: 404, message: 'Build not found' })

    if (build.status !== 'archived') {
        throw createError({ statusCode: 400, message: 'That app is not archived' })
    }

    const hasFiles = Array.isArray(build.files) ? build.files.length > 0 : false
    const status = hasFiles && build.testedAt ? 'review_required' : 'draft'

    const updated = await AfronetDevApp.findOneAndUpdate(
        { _id: id, userId: session.userId },
        { $set: { status, updatedAt: today() } },
        { new: true, lean: true },
    ) as any

    return { success: true, data: serializeAfronetDevApp(updated) }
})
