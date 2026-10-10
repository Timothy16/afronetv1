// server/api/pwa/stats.get.ts
import { AfronetPwaStats } from '../../models/AfronetPwaStats.model'

const BASE_COUNT = 12_577
const INCREMENT_PER_INSTALL = 107
const DELAY_MS = 3 * 60 * 60 * 1000 // 3 hours

export default defineEventHandler(async () => {
    await ensureMongo()

    const cutoff = new Date(Date.now() - DELAY_MS)

    // Atomically move any pending installs older than 3 hours into confirmed,
    // then return the updated document.
    const doc = await AfronetPwaStats.findOneAndUpdate(
        { key: 'global', 'pendingQueue.0': { $exists: true } },
        [
            {
                $set: {
                    confirmed: {
                        $add: [
                            '$confirmed',
                            {
                                $size: {
                                    $filter: {
                                        input: '$pendingQueue',
                                        as: 'ts',
                                        cond: { $lte: ['$$ts', cutoff] },
                                    },
                                },
                            },
                        ],
                    },
                    pendingQueue: {
                        $filter: {
                            input: '$pendingQueue',
                            as: 'ts',
                            cond: { $gt: ['$$ts', cutoff] },
                        },
                    },
                },
            },
        ],
        { new: true, upsert: false, lean: true },
    ) as any

    // If nothing was pending, just read the current confirmed count.
    const confirmed = doc?.confirmed
        ?? (await AfronetPwaStats.findOne({ key: 'global' }).lean<any>())?.confirmed
        ?? 0

    return {
        installs: BASE_COUNT + confirmed * INCREMENT_PER_INSTALL,
    }
})
