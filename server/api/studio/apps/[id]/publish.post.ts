// server/api/studio/apps/[id]/publish.post.ts
//
// Publishing a build: the checks, and then the store.
//
// This is the one endpoint that writes a listing. The listing is rebuilt from the build's own
// record — not from anything the browser sent — so what a user reads is always the version
// that was approved.
//
// Validation runs here rather than at generation, because this is the last point before an app
// becomes something other people can download. An app that fails never reaches the catalogue,
// and the reasons go back to the developer as review comments.
//
// There is no human reviewer yet. When there is, the guard below becomes "is this person a
// reviewer" instead of "does this person own the build", and a pass here becomes what puts the
// app in their queue rather than what publishes it.
import { AfronetApp } from '../../../../models/AfronetApp.model'
import { AfronetDevApp } from '../../../../models/AfronetDevApp.model'
import { AfronetUser } from '../../../../models/AfronetUser.model'
import { filesOf } from '../../../../utils/packageFormat'
import { listingFromBuild, listingSlug } from '../../../../utils/storeListing'
import { validateApp } from '../../../../utils/validateApp'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const build = await AfronetDevApp.findOne({ _id: id, userId: session.userId }).lean<any>()
    if (!build) throw createError({ statusCode: 404, message: 'Build not found' })

    if (!build.testedAt) {
        throw createError({ statusCode: 400, message: 'This build has not been tested since its last change' })
    }

    // The gate. Nothing a model wrote reaches a student's phone without being read first, and
    // a refusal says exactly what is wrong so the developer can describe the app differently.
    const validation = validateApp(filesOf(build), 'index.html', { savesProgress: build.config?.saveProgress !== false })
    if (!validation.ok) {
        throw createError({
            statusCode: 422,
            message: 'This app did not pass the automated checks.',
            data: { findings: validation.findings },
        })
    }

    const creator = await AfronetUser.findById(session.userId).select('firstName lastName username').lean<any>()
    const listing = listingFromBuild(build, creator, today())

    // An existing listing keeps its address; a new one takes its name, with a number only if
    // that address is already taken.
    let listingId = build.storeAppId
    if (!listingId) {
        const slug = listingSlug(build.name)
        const taken = await AfronetApp.exists({ _id: slug })
        listingId = taken ? `${slug}-${String(id).slice(0, 4)}` : slug
    }

    const existing = await AfronetApp.findById(listingId).lean<any>()

    await AfronetApp.findByIdAndUpdate(
        listingId,
        {
            $set: {
                ...listing,
                // A republished app keeps what its users gave it.
                rating: existing?.rating ?? 0,
                ratingCount: existing?.ratingCount ?? 0,
                installs: existing?.installs ?? 0,
                releasedAt: existing?.releasedAt ?? today(),
                changelog: existing?.changelog?.length
                    ? existing.changelog
                    : [{ version: build.version, date: today(), notes: 'First public release.', mandatory: false }],
                collections: existing?.collections?.length ? existing.collections : ['new', 'student'],
            },
        },
        { upsert: true, new: true },
    )

    const updated = await AfronetDevApp.findOneAndUpdate(
        { _id: id, userId: session.userId },
        {
            $set: {
                status: 'published',
                storeAppId: listingId,
                updatedAt: today(),
                versions: build.versions?.some((v: any) => v.version === build.version)
                    ? build.versions
                    : [{ version: build.version, date: today(), note: 'First public release' }, ...(build.versions ?? [])],
            },
        },
        { new: true, lean: true },
    ) as any

    const published = await AfronetApp.findById(listingId).lean<any>()

    return {
        success: true,
        data: { build: serializeAfronetDevApp(updated), listing: serializeAfronetApp(published) },
    }
})
