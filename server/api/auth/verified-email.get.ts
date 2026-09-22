// server/api/auth/verified-email.get.ts

// The email this browser verified, so the register form can prefill (and lock) it after a reload.
export default defineEventHandler(async (event) => {
    const session = await afronetSession(event)
    const email = session.data?.verifiedEmail

    if (!email) {
        throw createError({ statusCode: 404, message: 'No verified email. Please verify your email first.' })
    }

    return { success: true, data: { email } }
})
