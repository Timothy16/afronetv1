// server/api/studio/apps/[id]/package.get.ts
//
// The package for a build that has not been published — what Studio's preview runs.
//
// It is the same package the store would deliver, built by the same code, so what a developer
// approves in the preview is what a user gets. Owner only: an unpublished build is nobody
// else's business.
//
// The id it is namespaced under is the build's, not a listing's, so a preview can never read
// or write the storage of the published app it will become.
import { AfronetDevApp } from '../../../../models/AfronetDevApp.model'
import { buildPackage } from '../../../../utils/packageFormat'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const build = await AfronetDevApp.findOne({ _id: id, userId: session.userId }).lean<any>()
    if (!build) throw createError({ statusCode: 404, message: 'Build not found' })

    return { success: true, data: buildPackage(build, `preview-${id}`, today()) }
})
