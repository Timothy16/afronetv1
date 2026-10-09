// server/api/auth/dci-exchange.post.ts
import axios from 'axios'
import { AfronetUser } from '../../models/AfronetUser.model'

export default defineEventHandler(async (event) => {
  try {
    const { token } = await readBody(event)
    if (!token) throw createError({ statusCode: 400, message: 'Token is required' })

    // Must be a logged-in Afronet user — link only, never create.
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const user = await AfronetUser.findById(session.userId)
    if (!user) throw createError({ statusCode: 404, message: 'User not found' })
    if (!user.isActive) throw createError({ statusCode: 403, message: 'Your account has been deactivated' })

    // Verify the JWT with DCI.WIKI
    const config = useRuntimeConfig()
    let dciData: any = null

    try {
      const { data } = await axios.post(
        `${config.dciBaseUrl}/api/external/verify-dci-token`,
        { token },
        { headers: { 'x-api-key': config.dciApiKey } }
      )
      dciData = data
    } catch {
      throw createError({ statusCode: 401, message: 'DCI verification failed or token expired' })
    }

    if (dciData?.type !== 'afronet' || !dciData?.africanIdNumber) {
      throw createError({ statusCode: 400, message: 'Invalid DCI token' })
    }

    const africanId = dciData.africanIdNumber

    // One-African-ID-per-account — enforced in code, no unique index needed.
    const existing = await AfronetUser.findOne({ africanId, _id: { $ne: user._id } })
    if (existing) {
      throw createError({
        statusCode: 409,
        message: 'This African ID is already linked to another account',
      })
    }

    user.isDciVerified = true
    user.africanId = africanId
    await user.save()

    return { success: true, data: serializeAfronetUser(user.toObject()) }

  } catch (error: any) {
    console.error('Afronet DCI exchange error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Verification failed',
    })
  }
})