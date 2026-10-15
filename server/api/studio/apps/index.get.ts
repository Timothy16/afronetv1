// server/api/studio/apps/index.get.ts
//
// Everything this account has built. Studio is small enough that one call serves every screen
// in it, the same way the store fetches its catalogue once.
import { AfronetDevApp } from '../../../models/AfronetDevApp.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    // A new account opens Studio to an empty list, which is the truth: they have built nothing
    // yet. Demo builds here would be apps nobody generated, in a flow whose point is that every
    // app was.
    const builds = await AfronetDevApp
        .find({ userId: session.userId })
        .sort({ updatedAt: -1 })
        .lean<any[]>()

    return { success: true, data: builds.map(serializeAfronetDevApp) }
})
