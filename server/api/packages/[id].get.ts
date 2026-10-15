// server/api/packages/[id].get.ts
//
// The package for a published app — what the device actually downloads.
//
// The files were written once, when the developer generated the app, and stored on the build.
// This reads them and describes them: size, permissions, entry point, and the checksum the
// device recomputes to decide whether what it received is intact. Nothing is generated here,
// so downloading an app a thousand times costs what downloading it once does.
//
// A suspended listing still serves its package: someone who installed it keeps a working app,
// which is what the store promises them. What a suspended listing stops is new downloads, and
// the store already refuses those.
import { AfronetApp } from '../../models/AfronetApp.model'
import { AfronetDevApp } from '../../models/AfronetDevApp.model'
import { buildPackage } from '../../utils/packageFormat'

export default defineEventHandler(async (event) => {
    await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')

    const listing = await AfronetApp.findById(id).lean<any>()
    if (!listing) throw createError({ statusCode: 404, message: 'App not found' })

    // The build behind the listing holds the files the reviewer approved.
    const build = await AfronetDevApp.findOne({ storeAppId: id }).lean<any>()
    if (!build) {
        throw createError({ statusCode: 404, message: 'The build behind this app is missing' })
    }

    // The listing's version is the published one; the build may have moved on since.
    const pkg = buildPackage({ ...build, name: listing.name, version: listing.version }, id, today())

    return { success: true, data: pkg }
})
