// server/api/pwa/install.post.ts
import { AfronetPwaStats } from '../../models/AfronetPwaStats.model'

export default defineEventHandler(async () => {
    await ensureMongo()
    // Push the current timestamp into the pending queue.
    // It will only count toward the displayed total after 3 hours have passed.
    await AfronetPwaStats.findOneAndUpdate(
        { key: 'global' },
        { $push: { pendingQueue: new Date() } },
        { upsert: true },
    )
    return { success: true }
})
