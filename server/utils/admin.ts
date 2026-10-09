// server/utils/admin.ts
//
// To grant admin access, set isAdmin: true directly in MongoDB:
//   db.afronetusers.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
import { AfronetUser } from '../models/AfronetUser.model'

export async function requireAdmin(event: any) {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const user = await AfronetUser.findById(session.userId).select('isAdmin isActive').lean<any>()
    if (!user?.isActive || !user?.isAdmin) {
        throw createError({ statusCode: 403, message: 'Forbidden' })
    }
    return session
}
