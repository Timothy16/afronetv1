// server/api/pwa/stats.get.ts
import { AfronetPwaStats } from '../../models/AfronetPwaStats.model'

export default defineEventHandler(async () => {
    await ensureMongo()
    const stats = await AfronetPwaStats.findOne({ key: 'global' }).lean<any>()
    return { installs: stats?.installs ?? 0 }
})
