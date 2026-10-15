// server/api/apps/[id]/installed.post.ts
//
// A device reporting that it finished installing an app.
//
// The count on a listing was written once at publish and never moved, so every app in the
// store advertised "0 installs" however many people had downloaded it.
//
// It counts accounts, not presses. A row is written the first time an account installs an app
// and never again, so pressing Get twice, clearing a cache, or reinstalling on a second
// device adds nothing. Without that the number was whatever anyone chose to make it.
//
// Called once a download has been verified and put on the device — not when the package is
// fetched, which also happens for a preview or a reinstall.
import { AfronetApp } from '../../../models/AfronetApp.model'
import { AfronetAppInstall } from '../../../models/AfronetAppInstall.model'
import { today } from '../../../utils/clock'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const body = await readBody(event).catch(() => ({}))

    const listing = await AfronetApp.findById(id).select('installs version').lean<any>()
    if (!listing) throw createError({ statusCode: 404, message: 'App not found' })

    // Upsert on a key built from the pair, so two requests arriving together still leave one
    // row. `upserted` is set only when this call was the one that created it.
    const appFilesMB = Number(body?.appFilesMB) || 0

    const result = await AfronetAppInstall.updateOne(
        { _id: `${session.userId}:${id}` },
        {
            // The version and size are of whatever was just installed, so they move with an
            // update. When it was first installed does not.
            $set: { version: listing.version, appFilesMB },
            $setOnInsert: { userId: session.userId, appId: id, installedAt: today() },
        },
        { upsert: true },
    )

    const isFirst = Boolean(result?.upsertedCount)
    if (!isFirst) return { success: true, data: { installs: listing.installs ?? 0, counted: false } }

    const updated = await AfronetApp.findByIdAndUpdate(
        id,
        { $inc: { installs: 1 } },
        { new: true, lean: true },
    ) as any

    return { success: true, data: { installs: updated?.installs ?? 0, counted: true } }
})
