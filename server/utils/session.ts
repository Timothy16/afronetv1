// server/utils/session.ts
import { randomUUID } from 'node:crypto'

const SESSION_NAME = 'afronet_session'

/** 7 days, measured from when the session was issued. */
const SESSION_MAX_AGE = 60 * 60 * 24 * 7
/** Re-issue a session once it is a day old, so an app in daily use never expires ("sliding"). */
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000

// One place for the session config so every auth route stays in sync.
export function afronetSession(event: any) {
    const config = useRuntimeConfig()
    return useSession(event, {
        name: SESSION_NAME,
        password: config.sessionSecret,
        maxAge: SESSION_MAX_AGE, // counted from the session's createdAt
        cookie: { httpOnly: true, sameSite: 'lax', secure: !import.meta.dev },
    })
}

// Replace whatever session the browser has with a brand-new one holding only `data`.
// h3's clear() + update() isn't enough: update() re-reads the old cookie from the
// request, bringing back its id, its createdAt (so the clock keeps running from the
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
//
// Also keeps an active user signed in: once the session is a day old it is re-issued, so the
// 7 days run from the last day of use rather than from the first sign-in. Someone who opens the
// app offline keeps reading and chatting from their device either way; they only need to sign in
// again to sync.
export async function requireAfronetUser(event: any) {
    const session = await afronetSession(event)
    if (!session.data?.userId) {
        throw createError({ statusCode: 401, message: 'Not authenticated' })
    }

    const data = { ...session.data }
    const issuedAt = event.context.sessions?.[SESSION_NAME]?.createdAt ?? 0
    if (Date.now() - issuedAt > RENEW_AFTER_MS) {
        await startAfronetSession(event, data)
    }
    return data
}
