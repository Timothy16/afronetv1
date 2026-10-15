// server/api/apps/installed.get.ts
//
// This account's library: the apps it has installed, wherever it is signed in.
//
// The list used to live only in the browser and was reconciled against the files in Cache
// Storage, so clearing a cache emptied it and the store offered to install apps the person
// already had. The files are a device's business; the library is the account's.
//
// What this does not say is whether the files are on *this* device. The browser works that
// out for itself, because only it can.
import { AfronetAppInstall } from '../../models/AfronetAppInstall.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const rows = await AfronetAppInstall
        .find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .lean<any[]>()

    return {
        success: true,
        data: rows.map((r) => ({
            appId: r.appId,
            version: r.version ?? '',
            appFilesMB: r.appFilesMB ?? 0,
            installedAt: r.installedAt ?? '',
        })),
    }
})
