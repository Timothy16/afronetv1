// server/api/studio/apps/[id].put.ts
//
// Changes a build: its listing text, its config, its pricing, its test result, where it is in
// review. One endpoint rather than six, because every Studio screen edits the same record.
//
// Only the fields named here can be written, and `published` is not one of the statuses a
// client may set — an app becomes published by being approved, through the publish endpoint.
import { AfronetDevApp } from '../../../models/AfronetDevApp.model'

const WRITABLE = [
    'name', 'tagline', 'description', 'icon', 'tone', 'category',
    'config', 'features', 'privacyPolicy', 'supportEmail',
    'listingDone', 'pricingDone', 'pricingModel', 'price',
    'testedAt', 'packageMB', 'installedMB',
    'status', 'reviewComments', 'versions', 'version',
]

const SETTABLE_STATUS = [
    'draft', 'generating', 'building', 'testing',
    'review_required', 'in_review', 'rejected', 'archived',
]

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const patch: Record<string, any> = {}
    for (const key of WRITABLE) {
        if (body?.[key] !== undefined) patch[key] = body[key]
    }

    if (patch.status && !SETTABLE_STATUS.includes(patch.status)) {
        throw createError({ statusCode: 400, message: `Cannot set status to ${patch.status}` })
    }

    if (!Object.keys(patch).length) {
        throw createError({ statusCode: 400, message: 'Nothing to change' })
    }

    patch.updatedAt = typeof body?.updatedAt === 'string' ? body.updatedAt : patch.updatedAt

    const build = await AfronetDevApp.findOneAndUpdate(
        { _id: id, userId: session.userId },
        { $set: patch },
        { new: true, lean: true },
    ) as any

    if (!build) throw createError({ statusCode: 404, message: 'Build not found' })

    return { success: true, data: serializeAfronetDevApp(build) }
})
