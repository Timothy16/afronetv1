// server/utils/session.ts
import { randomUUID } from 'node:crypto'

const SESSION_NAME = 'afronet_session'

// One place for the session config so every auth route stays in sync.
export function afronetSession(event: any) {
    const config = useRuntimeConfig()
    return useSession(event, {
        name: SESSION_NAME,
        password: config.sessionSecret,
        maxAge: 60 * 60 * 8, // 8 hours, counted from the session's createdAt
        cookie: { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev },
    })
}

// Replace whatever session the browser has with a brand-new one holding only `data`.
// h3's clear() + update() isn't enough: update() re-reads the old cookie from the
// request, bringing back its id, its createdAt (so the 8h clock keeps running from the
// first guest visit) and any leftover data. Seeding h3's per-request session slot
// (event.context.sessions, h3 v1) makes update() seal a fresh session instead.
export async function startAfronetSession(event: any, data: Record<string, any>) {
    const session = await afronetSession(event)
    await session.clear()
    event.context.sessions ||= Object.create(null)
    event.context.sessions[SESSION_NAME] = { id: randomUUID(), createdAt: Date.now(), data: {} }
    await session.update(data)
}

// Throws 401 if there is no valid session. Returns the session data.
export async function requireAfronetUser(event: any) {
    const session = await afronetSession(event)
    if (!session.data?.userId) {
        throw createError({ statusCode: 401, message: 'Not authenticated' })
    }
    return session.data
}
