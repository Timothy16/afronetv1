// server/api/packages/[id].get.ts
//
// The package for a published app — what the device actually downloads.
//
// The files were written once, when the developer generated the app, and stored on the build.
// This reads them and describes them: size, permissions, entry point, and the checksum the
// device recomputes to decide whether what it received is intact. Nothing is generated here,
// so downloading an app a thousand times costs what downloading it once does.
//
// A withdrawn app still serves its package to anyone who already has it — their copy keeps
// working, which is exactly what the confirmation promised the developer. It serves nobody
// else.
//
// That rule is enforced here rather than by the store's screens. Taking an app down is a
// safety action, and a disabled button is not a refusal: anyone could ask for the package
// directly. The account's library lives on the server now, so the server can tell who had it.
import { AfronetApp } from '../../models/AfronetApp.model'
import { AfronetAppInstall } from '../../models/AfronetAppInstall.model'
import { AfronetDevApp } from '../../models/AfronetDevApp.model'
import { buildPackage } from '../../utils/packageFormat'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')

    const listing = await AfronetApp.findById(id).lean<any>()
    if (!listing) throw createError({ statusCode: 404, message: 'App not found' })

    if (listing.status !== 'live') {
        const had = await AfronetAppInstall.exists({ _id: `${session.userId}:${id}` })
        if (!had) {
            throw createError({
                statusCode: 403,
                message: 'This app has been taken down and is no longer available to download.',
            })
        }
    }

    // The build behind the listing holds the files the reviewer approved.
    const build = await AfronetDevApp.findOne({ storeAppId: id }).lean<any>()
    if (!build) {
        throw createError({ statusCode: 404, message: 'The build behind this app is missing' })
    }

    // The listing's version is the published one; the build may have moved on since.
    const pkg = buildPackage({ ...build, name: listing.name, version: listing.version }, id, today())

    return { success: true, data: pkg }
})
