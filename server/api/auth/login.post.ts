// server/api/auth/login.post.ts
import bcrypt from 'bcryptjs'
import { AfronetUser } from '../../models/AfronetUser.model'

export default defineEventHandler(async (event) => {
    await ensureMongo()

    const body = await readBody(event)
    const raw = typeof body?.identifier === 'string' ? body.identifier.trim() : ''
    const password = typeof body?.password === 'string' ? body.password : ''

    if (!raw || !password) {
        throw createError({ statusCode: 400, message: 'Email or username and password are required' })
    }

    // Email if it contains "@" after the first character, otherwise a username ("@elijah" -> "elijah")
    const isEmail = raw.indexOf('@') > 0
    const query = isEmail ? { email: normalizeEmail(raw) } : { username: normalizeUsername(raw) }

    const user = await AfronetUser.findOne(query)

    // Same message for every failure so we don't reveal which accounts exist
    const invalid = () => createError({ statusCode: 401, message: 'Invalid credentials' })

    if (!user || !user.password || !user.isActive) throw invalid()

    const passwordMatches = await bcrypt.compare(password, user.password)
    if (!passwordMatches) throw invalid()

    user.lastLogin = new Date()
    await user.save()

    await startAfronetSession(event, { userId: user._id.toString() })

    return { success: true, data: serializeAfronetUser(user) }
})
