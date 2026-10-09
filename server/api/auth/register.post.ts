// server/api/auth/register.post.ts
import bcrypt from 'bcryptjs'
import { AfronetUser } from '../../models/AfronetUser.model'
// import { AfronetEmailVerification } from '../../models/AfronetEmailVerification.model'

export default defineEventHandler(async (event) => {
    await ensureMongo()

    const body = await readBody(event)

    // --- Old flow: email came from a verified session, never the body ---
    // const session = await afronetSession(event)
    // const email = normalizeEmail(session.data?.verifiedEmail)
    // if (!email) {
    //     throw createError({ statusCode: 403, message: 'Please verify your email before creating your African ID' })
    // }

    // --- New flow: email supplied directly in the registration form ---
    const email = normalizeEmail(body?.email)

    const firstName = cleanString(body?.firstName)
    const lastName = cleanString(body?.lastName)
    const institution = cleanString(body?.institution)
    const country = cleanString(body?.country)
    const city = cleanString(body?.city)
    const password = typeof body?.password === 'string' ? body.password : ''

    // --- Old fields (no longer collected in the new registration form) ---
    // const username = normalizeUsername(body?.username)
    // const phone = normalizePhone(body?.phone)
    // const profileImage = cleanString(body?.profileImage)

    const fail = (message: string) => {
        throw createError({ statusCode: 400, message })
    }

    if (!email) fail('Email is required')
    if (!EMAIL_PATTERN.test(email)) fail('Enter a valid email address')

    if (!firstName) fail('First name is required')
    if (!lastName) fail('Last name is required')
    if (firstName.length > 50 || lastName.length > 50) fail('Names must be 50 characters or fewer')

    if (!institution) fail('Institution / University is required')
    if (institution.length > 100) fail('Institution name must be 100 characters or fewer')

    if (!country) fail('Country is required')
    if (country.length > 100) fail('Country must be 100 characters or fewer')

    if (!city) fail('City is required')
    if (city.length > 100) fail('City must be 100 characters or fewer')

    if (!password) fail('Password is required')
    if (password.length < PASSWORD_MIN_LENGTH) {
        fail(`Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
    }

    // --- Old validation (username / phone) ---
    // if (!username) fail('Username is required')
    // if (!USERNAME_PATTERN.test(username)) {
    //     fail('Username must be 3–30 characters: letters, numbers, dots or underscores')
    // }
    // if (!phone) fail('Phone number is required')
    // if (!PHONE_PATTERN.test(phone)) fail('Enter a valid phone number')

    const existing = await AfronetUser.findOne({ email }).lean<any>()
    if (existing) {
        throw createError({ statusCode: 409, message: 'An account with this email already exists' })
    }

    let user
    try {
        user = await AfronetUser.create({
            firstName,
            lastName,
            email,
            institution,
            country,
            city,
            password: await bcrypt.hash(password, 12),
            lastLogin: new Date(),
        })
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw createError({ statusCode: 409, message: 'An account with this email already exists' })
        }
        throw error
    }

    // --- Old: verification record cleanup ---
    // await AfronetEmailVerification.deleteMany({ email })

    await startAfronetSession(event, { userId: user._id.toString() })

    return { success: true, data: serializeAfronetUser(user) }
})
