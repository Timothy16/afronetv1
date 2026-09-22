// server/api/auth/send-verification.post.ts
import { createHash, randomBytes } from 'node:crypto'
import { Resend } from 'resend'
import { AfronetUser } from '../../models/AfronetUser.model'
import { AfronetEmailVerification } from '../../models/AfronetEmailVerification.model'

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours
const RESEND_COOLDOWN_MS = 60 * 1000 // one email per address per minute

export default defineEventHandler(async (event) => {
    await ensureMongo()

    const body = await readBody(event)
    const email = normalizeEmail(body?.email)

    if (!email) throw createError({ statusCode: 400, message: 'Email is required' })
    if (!EMAIL_PATTERN.test(email)) throw createError({ statusCode: 400, message: 'Enter a valid email address' })

    const existingUser = await AfronetUser.findOne({ email }).lean()
    if (existingUser) {
        throw createError({ statusCode: 409, message: 'An account with this email already exists. Sign in instead.' })
    }

    const latest = await AfronetEmailVerification.findOne({ email }).sort({ createdAt: -1 }).lean<any>()
    if (latest?.createdAt) {
        const waitMs = RESEND_COOLDOWN_MS - (Date.now() - new Date(latest.createdAt).getTime())
        if (waitMs > 0) {
            throw createError({
                statusCode: 429,
                message: `Please wait ${Math.ceil(waitMs / 1000)}s before requesting another email`,
            })
        }
    }

    const rawToken = randomBytes(32).toString('hex')
    const hashedToken = createHash('sha256').update(rawToken).digest('hex')

    // Replace earlier attempts for this email rather than piling up records
    await AfronetEmailVerification.deleteMany({ email })
    await AfronetEmailVerification.create({
        email,
        token: hashedToken,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
    })

    const config = useRuntimeConfig()
    const appUrl = config.public.appUrl || getRequestURL(event).origin
    const verifyUrl = `${appUrl}/welcome/verify/${rawToken}`

    const html = renderEmailLayout({
        appUrl,
        preheader: 'Confirm your email to continue creating your African ID.',
        bodyHtml: `
        ${emailEyebrow('Email verification')}
        ${emailHeading('Verify your email')}
        ${emailParagraph('Welcome to Afronet. Confirm this is your email address to continue creating your African ID.')}
        ${emailCtaPanel(emailButton(verifyUrl, 'Verify email'), 'This link expires in 24 hours.')}
        ${emailParagraph(`If the button doesn't work, copy and paste this link into your browser:<br><span style="color:#8f9792;font-size:13px;word-break:break-all;">${verifyUrl}</span>`)}
      `,
    })

    try {
        // Resend reports API failures in `error` and throws on network failures; treat both the same
        const resend = new Resend(config.resendApiKey)
        const { error } = await resend.emails.send({
            from: AFRONET_EMAIL_FROM,
            to: email,
            subject: 'Verify your email - Afronet',
            html,
        })
        if (error) throw error
    } catch (sendError) {
        console.error('Afronet verification email send error:', sendError)
        // Drop the record so the cooldown doesn't block an immediate retry
        await AfronetEmailVerification.deleteOne({ token: hashedToken })
        throw createError({ statusCode: 502, message: 'Failed to send verification email' })
    }

    return { success: true, message: 'Verification email sent' }
})
