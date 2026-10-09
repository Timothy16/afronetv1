// server/api/admin/chat-stats.get.ts
import { AfronetUser } from '../../models/AfronetUser.model'
import { AfronetConversation } from '../../models/AfronetConversation.model'
import { AfronetMessage } from '../../models/AfronetMessage.model'

export default defineEventHandler(async (event) => {
    await ensureMongo()

    const [users, convGroups, msgGroups] = await Promise.all([
        AfronetUser
            .find({})
            .select('firstName lastName email institution country city isActive isAdmin lastLogin createdAt')
            .sort({ createdAt: -1 })
            .lean<any[]>(),

        // Non-deleted chat count + last chat date, grouped by owner
        AfronetConversation.aggregate([
            {
                $group: {
                    _id: '$userId',
                    total: { $sum: 1 },
                    // A null deletedAt means the conversation is still alive
                    chats: { $sum: { $cond: [{ $eq: ['$deletedAt', null] }, 1, 0] } },
                    lastChatAt: { $max: '$updatedAt' },
                },
            },
        ]),

        // Message counts split by role, grouped by owner
        AfronetMessage.aggregate([
            {
                $group: {
                    _id: { userId: '$userId', role: '$role' },
                    count: { $sum: 1 },
                },
            },
        ]),
    ])

    // Build lookup maps for O(1) merge
    const convMap = new Map<string, { chats: number; lastChatAt: Date | null }>()
    for (const c of convGroups) {
        convMap.set(String(c._id), { chats: c.chats, lastChatAt: c.lastChatAt ?? null })
    }

    const msgMap = new Map<string, { questions: number; aiReplies: number }>()
    for (const m of msgGroups) {
        const uid = String(m._id.userId)
        if (!msgMap.has(uid)) msgMap.set(uid, { questions: 0, aiReplies: 0 })
        const entry = msgMap.get(uid)!
        if (m._id.role === 'user') entry.questions = m.count
        if (m._id.role === 'assistant') entry.aiReplies = m.count
    }

    const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

    const rows = users.map(u => {
        const uid = String(u._id)
        const conv = convMap.get(uid) ?? { chats: 0, lastChatAt: null }
        const msg = msgMap.get(uid) ?? { questions: 0, aiReplies: 0 }

        // Last active = most recent of lastLogin and last conversation update
        const dates = [u.lastLogin, conv.lastChatAt].filter(Boolean) as Date[]
        const lastActive = dates.length ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null

        return {
            id: uid,
            name: [u.firstName, u.lastName].filter(Boolean).join(' ') || null,
            email: u.email ?? null,
            institution: u.institution ?? null,
            country: u.country ?? null,
            isActive: u.isActive,
            isAdmin: u.isAdmin ?? false,
            joined: u.createdAt,
            lastActive,
            chats: conv.chats,
            questions: msg.questions,
            aiReplies: msg.aiReplies,
        }
    })

    const activeUsers30d = rows.filter(
        r => r.lastActive && new Date(r.lastActive) >= since30d,
    ).length

    return {
        summary: {
            totalUsers: rows.length,
            totalChats: rows.reduce((s, r) => s + r.chats, 0),
            totalQuestions: rows.reduce((s, r) => s + r.questions, 0),
            activeUsers30d,
        },
        rows,
    }
})
