// server/utils/chatSync.ts
//
// Shared checks for the conversation endpoints. Ownership is decided by the session, never by
// anything the client sends: a uuid that exists under another account must look like it doesn't
// exist at all.

import { AfronetConversation } from '../models/AfronetConversation.model'

/** Device-generated uuids (or the fallback id used when crypto.randomUUID is unavailable). */
export const CLIENT_ID_PATTERN = /^[A-Za-z0-9_-]{8,64}$/

export const MAX_TITLE_LENGTH = 120
export const MAX_CONTENT_LENGTH = 32_000

export function requireClientId(value: unknown, what = 'id') {
    const id = typeof value === 'string' ? value.trim() : ''
    if (!CLIENT_ID_PATTERN.test(id)) throw createError({ statusCode: 400, message: `Invalid ${what}` })
    return id
}

/** A date sent by a device; invalid or missing values fall back to now. */
export function clientDate(value: unknown, fallback = new Date()) {
    if (typeof value !== 'string' && !(value instanceof Date)) return fallback
    const date = new Date(value as string)
    return Number.isNaN(date.getTime()) ? fallback : date
}

/** The conversation, if it belongs to this user. Returns null when it does not exist. */
export async function findOwnConversation(id: string, userId: string) {
    const conversation = await AfronetConversation.findById(id).lean<any>()
    if (!conversation) return null
    if (String(conversation.userId) !== String(userId)) {
        // Someone else's id: answer exactly as for an unknown one.
        throw createError({ statusCode: 404, message: 'Conversation not found' })
    }
    return conversation
}

export function serializeConversation(c: any) {
    return {
        id: c._id,
        title: c.title,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        deletedAt: c.deletedAt ?? null,
    }
}

export function serializeMessage(m: any) {
    return {
        id: m._id,
        conversationId: m.conversationId,
        seq: m.seq,
        role: m.role,
        content: m.content,
        status: m.status,
        model: m.model ?? undefined,
        stats: m.stats ?? undefined,
        createdAt: m.createdAt,
    }
}
