// server/api/studio/apps/[id]/ship.post.ts
//
// Shipping the current build to people who already have the app.
//
// The listing is rebuilt from the build, exactly as publishing does, so an update carries
// everything the developer changed — the name, the description, the feature highlights, the
// price. It used to write only the version and the changelog, which meant an update announced
// itself in "What's new" while the store went on showing the old listing.
//
// Changed in place rather than replaced, so its ratings, install count and release date
// survive, and the note goes into the changelog users read in My Apps before they update. A
// listing that was suspended comes back live.
import { AfronetApp } from '../../../../models/AfronetApp.model'
import { AfronetDevApp } from '../../../../models/AfronetDevApp.model'
import { AfronetUser } from '../../../../models/AfronetUser.model'
import { filesOf } from '../../../../utils/packageFormat'
import { bumpVersion, listingFromBuild } from '../../../../utils/storeListing'
import { validateApp } from '../../../../utils/validateApp'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)
    const notes = String(body?.notes ?? '').trim() || 'Improvements and fixes.'
    const mandatory = Boolean(body?.mandatory)

    const build = await AfronetDevApp.findOne({ _id: id, userId: session.userId }).lean<any>()
    if (!build) throw createError({ statusCode: 404, message: 'Build not found' })
    if (!build.storeAppId) throw createError({ statusCode: 400, message: 'This app has not been published yet' })
    if (!build.testedAt) {
        throw createError({ statusCode: 400, message: 'This build has not been tested since its last change' })
    }

    // An update is a new app reaching the same people, so it passes the same checks.
    const validation = validateApp(filesOf(build), 'index.html', { savesProgress: build.config?.saveProgress !== false })
    if (!validation.ok) {
        throw createError({
            statusCode: 422,
            message: 'This update did not pass the automated checks.',
            data: { findings: validation.findings },
        })
    }

    const version = bumpVersion(build.version)
    const listing = await AfronetApp.findById(build.storeAppId).lean<any>()

    const creator = await AfronetUser.findById(session.userId).select('firstName lastName username').lean<any>()
    const rebuilt = listingFromBuild({ ...build, version }, creator, today())

    await AfronetApp.findByIdAndUpdate(build.storeAppId, {
        $set: {
            ...rebuilt,
            status: 'live',
            // What belongs to the listing rather than the build, and must survive an update.
            rating: listing?.rating ?? 0,
            ratingCount: listing?.ratingCount ?? 0,
            installs: listing?.installs ?? 0,
            releasedAt: listing?.releasedAt ?? today(),
            collections: listing?.collections?.length ? listing.collections : ['new', 'student'],
            changelog: [
                { version, date: today(), notes, mandatory },
                ...(listing?.changelog ?? []),
            ],
        },
    })

    const updated = await AfronetDevApp.findOneAndUpdate(
        { _id: id, userId: session.userId },
        {
            $set: {
                version,
                status: 'published',
                updatedAt: today(),
                versions: [{ version, date: today(), note: notes }, ...(build.versions ?? [])],
            },
        },
        { new: true, lean: true },
    ) as any

    const refreshed = await AfronetApp.findById(build.storeAppId).lean<any>()

    return {
        success: true,
        data: { version, build: serializeAfronetDevApp(updated), listing: serializeAfronetApp(refreshed) },
    }
})
