// server/api/auth/register.post.ts
import bcrypt from 'bcryptjs'
import { AfronetUser } from '../../models/AfronetUser.model'
import { AfronetEmailVerification } from '../../models/AfronetEmailVerification.model'

export default defineEventHandler(async (event) => {
    await ensureMongo()

    const body = await readBody(event)

    // The email comes from the verification session, never the body (see verify-email)
    const session = await afronetSession(event)
    const email = normalizeEmail(session.data?.verifiedEmail)
    if (!email) {
        throw createError({ statusCode: 403, message: 'Please verify your email before creating your African ID' })
    }

    const firstName = cleanString(body?.firstName)
    const lastName = cleanString(body?.lastName)
    const username = normalizeUsername(body?.username)
    const phone = normalizePhone(body?.phone)
    const country = body?.country
    const password = typeof body?.password === 'string' ? body.password : ''
    const profileImage = cleanString(body?.profileImage)

    const fail = (message: string) => {
        throw createError({ statusCode: 400, message })
    }

    if (!firstName) fail('First name is required')
    if (!lastName) fail('Last name is required')
    if (firstName.length > 50 || lastName.length > 50) fail('Names must be 50 characters or fewer')

    if (!username) fail('Username is required')
    if (!USERNAME_PATTERN.test(username)) {
        fail('Username must be 3–30 characters: letters, numbers, dots or underscores')
    }

    if (!phone) fail('Phone number is required')
    if (!PHONE_PATTERN.test(phone)) fail('Enter a valid phone number')

    // The country id is the source of truth; the rest of the object is stored alongside it
    if (!country || typeof country !== 'object' || country.id === undefined || country.id === null || country.id === '') {
        fail('Country is required')
    }

    // Optional, but if sent it must be a path our upload flow issued (not an arbitrary URL)
    if (profileImage && !PROFILE_IMAGE_PATTERN.test(profileImage)) fail('Invalid profile image')

    if (!password) fail('Password is required')
    if (password.length < PASSWORD_MIN_LENGTH) {
        fail(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    }

    const existing = await AfronetUser.findOne({ $or: [{ username }, { email }] }).lean<any>()
    if (existing) {
        const field = existing.username === username ? 'username' : 'email'
        throw createError({ statusCode: 409, message: `An account with this ${field} already exists` })
    }

    let user
    try {
        user = await AfronetUser.create({
            firstName,
            lastName,
            username,
            email,
            phone,
            country,
            profileImage: profileImage || null,
            password: await bcrypt.hash(password, 12),
            lastLogin: new Date(), // register signs the user in
        })
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw createError({ statusCode: 409, message: 'An account with this username or email already exists' })
        }
        throw error
    }

    // Verification is spent: drop the record and swap the guest session for a logged-in one
    await AfronetEmailVerification.deleteMany({ email })
    await startAfronetSession(event, { userId: user._id.toString() })

    return { success: true, data: serializeAfronetUser(user) }
})
