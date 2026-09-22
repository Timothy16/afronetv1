// server/api/auth/me.get.ts
import { AfronetUser } from '../../models/AfronetUser.model'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const user = await AfronetUser.findById(session.userId).lean<any>()

    // Deleted or deactivated since the session was issued: drop the stale cookie
    if (!user || !user.isActive) {
        await (await afronetSession(event)).clear()
        throw createError({ statusCode: 401, message: 'Not authenticated' })
    }

    return { success: true, data: serializeAfronetUser(user) }
})
