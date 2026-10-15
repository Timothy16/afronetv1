// server/api/apps/[id]/installed.delete.ts
//
// Removing an app from this account's library.
//
// My Apps is a list of what someone has, so uninstalling takes the app out of it everywhere
// they are signed in — not only on the device they pressed the button on.
//
// The install count on the listing does not go down. That number is all-time downloads, which
// is what the store says beneath it, and a developer's figure should not move backwards
// because somebody needed the space back.
import { AfronetAppInstall } from '../../../models/AfronetAppInstall.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    await AfronetAppInstall.deleteOne({ _id: `${session.userId}:${id}` })

    return { success: true, data: { removed: true } }
})
