// server/api/pwa/install.post.ts
import { AfronetPwaStats } from '../../models/AfronetPwaStats.model'

export default defineEventHandler(async () => {
    await ensureMongo()
    await AfronetPwaStats.findOneAndUpdate(
        { key: 'global' },
        { $inc: { installs: 1 } },
        { upsert: true, new: true },
    )
    return { success: true }
})
