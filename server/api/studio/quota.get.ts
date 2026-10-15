// server/api/studio/quota.get.ts
//
// What this account has left. Read by Studio so a developer knows before they start describing
// an app, rather than after the refusal.
import { balanceFor } from '../../utils/tokenAllowance'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    return { success: true, data: await balanceFor(session.userId) }
})
