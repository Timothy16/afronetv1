// server/api/studio/quota.get.ts
//
// What this account has left. Read by Studio so a developer knows before they start describing
// an app, rather than after the refusal.
import { quotaFor } from '../../utils/generationQuota'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    return { success: true, data: await quotaFor(session.userId) }
})
