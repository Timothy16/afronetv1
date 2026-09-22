// server/api/auth/verify-email.post.ts
import { createHash } from 'node:crypto'
import { AfronetEmailVerification } from '../../models/AfronetEmailVerification.model'

export default defineEventHandler(async (event) => {
    await ensureMongo()

    const body = await readBody(event)
    const token = typeof body?.token === 'string' ? body.token.trim() : ''
    if (!token) throw createError({ statusCode: 400, message: 'Verification token is required' })

    const hashedToken = createHash('sha256').update(token).digest('hex')

    const record = await AfronetEmailVerification.findOne({ token: hashedToken })
    if (!record) {
        throw createError({ statusCode: 400, message: 'This verification link is invalid or has already been used' })
    }

    if (!record.expiresAt || record.expiresAt < new Date()) {
        await AfronetEmailVerification.deleteOne({ _id: record._id })
        throw createError({ statusCode: 400, message: 'This verification link has expired' })
    }

    // Idempotent: reloading the verify page re-fires this safely
    if (!record.verified) {
        record.verified = true
        await record.save()
    }

    // Bind the verified email to this browser. Register reads it from here,
    // never from the request body, so the email can't be swapped client-side.
    // A fresh session so the 8h clock starts now, not at the first guest visit
    await startAfronetSession(event, { verifiedEmail: record.email })

    return { success: true, data: { email: record.email } }
})
