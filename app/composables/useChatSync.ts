// app/composables/useChatSync.ts
//
// Keeps the device's conversations and the user's account in step.
//
// Push: every local write leaves an entry in the outbox; this sends them in order and removes
// each one once the server has it. Ids come from the device, so re-sending after a dropped
// connection can never duplicate anything.
// Pull: ask for everything changed since the last successful sync and merge it in.
//
// Nothing here is required for chatting: with no connection the outbox simply grows.

import {
    deleteOp,
    listConversations,
    getConversation,
    getMessage,
    hardDeleteConversation,
    hasMessages,
    listMessages,
    listOutbox,
    putConversation,
    putMessage,
    type OutboxOp,
    type StoredConversation,
} from '~/lib/chatStore'
import { logEvent } from '~/lib/crashlog'
import { useAfronetUserStore } from '~/stores/afronetUser'

const syncing = ref(false)
const pending = ref(0)
const lastError = ref<string | null>(null)
const lastSyncedAt = ref<string | null>(null)

let listening = false
let queued: ReturnType<typeof setTimeout> | null = null
/** Grows while syncing keeps failing, so a server problem is not hammered. */
let backoffMs = 0
const FIRST_RETRY_MS = 5_000
const MAX_RETRY_MS = 5 * 60_000

const SINCE_KEY = (userId: string) => `afronet:lastsync:${userId}`

function readSince(userId: string) {
    try { return localStorage.getItem(SINCE_KEY(userId)) }
    catch { return null }
}

function writeSince(userId: string, value: string) {
    try { localStorage.setItem(SINCE_KEY(userId), value) }
    catch { /* storage unavailable: we just re-fetch more next time */ }
}

export function forgetSince(userId: string) {
    try { localStorage.removeItem(SINCE_KEY(userId)) }
    catch { /* nothing to clean up */ }
}

/**
 * Whether the server will never accept this item, however often we ask.
 *
 * 401 is deliberately NOT in here. It means the session ended, which is temporary — treating it
 * as permanent used to delete the queued upload, so a conversation written while a session was
 * lapsing never reached the account and was then lost when the device's copy was cleared.
 */
function isPermanent(err: any) {
    const status = err?.statusCode ?? err?.response?.status ?? 0
    if (status === 401 || status === 408 || status === 429) return false
    return status >= 400 && status < 500
}

/** Only the newest entry per item matters — a conversation renamed three times uploads once. */
function dedupe(ops: OutboxOp[]) {
    const keep = new Map<string, OutboxOp>()
    const stale: number[] = []
    for (const op of ops) {
        const key = `${op.kind}:${op.id}`
        const previous = keep.get(key)
        if (previous?.seq !== undefined) stale.push(previous.seq)
        keep.set(key, op)
    }
    return { ops: [...keep.values()], stale }
}

async function pushOne(op: OutboxOp) {
    if (op.kind === 'conversation') {
        const conversation = await getConversation(op.id)
        if (!conversation) return // deleted locally before it ever reached the server
        await $fetch(`/api/conversations/${op.id}`, {
            method: 'PUT',
            body: {
                title: conversation.title,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                deletedAt: conversation.deletedAt,
            },
        })
        return
    }

    const message = await getMessage(op.id)
    if (!message) return
    await $fetch(`/api/conversations/${message.conversationId}/messages/${message.id}`, {
        method: 'PUT',
        body: {
            seq: message.seq,
            role: message.role,
            content: message.content,
            status: message.status,
            model: message.model,
            stats: message.stats,
            createdAt: message.createdAt,
        },
    })
}

async function push(userId: string) {
    const { ops, stale } = dedupe(await listOutbox(userId))
    for (const seq of stale) await deleteOp(seq)
    pending.value = ops.length

    for (const op of ops) {
        try {
            await pushOne(op)
            if (op.seq !== undefined) await deleteOp(op.seq)
            pending.value = Math.max(0, pending.value - 1)
        }
        catch (err: any) {
            if (isPermanent(err)) {
                // The server refuses it (too long, belongs to someone else): drop it rather than
                // retry forever, and leave a trace for support.
                if (op.seq !== undefined) await deleteOp(op.seq)
                pending.value = Math.max(0, pending.value - 1)
                logEvent(`sync dropped ${op.kind} ${op.id}: ${err?.data?.message || err?.message}`)
                continue
            }
            throw err // offline or server trouble: keep the rest queued, try again later
        }
    }
}

async function pull(userId: string) {
    // With nothing stored locally, ask for everything. Asking "what changed since X?" on an empty
    // device can only ever return nothing, which is how a signed-out-and-back-in device ended up
    // with a permanently empty conversation list.
    const empty = (await listConversations(userId)).length === 0
    const since = empty ? null : readSince(userId)
    if (empty) logEvent('sync: device has no conversations, pulling everything')

    const response = await $fetch<{ data: Array<StoredConversation & { id: string }> }>('/api/conversations', {
        query: since ? { since } : undefined,
    })
    const pulled = response.data?.length ?? 0

    let newest = since ?? ''
    for (const remote of response.data ?? []) {
        if (remote.updatedAt > newest) newest = remote.updatedAt

        if (remote.deletedAt) {
            await hardDeleteConversation(remote.id)
            continue
        }

        const local = await getConversation(remote.id)
        // Last write wins, and a device that has not uploaded its own newer change keeps it.
        if (local && local.updatedAt >= remote.updatedAt) continue

        await putConversation({
            id: remote.id,
            userId,
            title: remote.title,
            createdAt: remote.createdAt,
            updatedAt: remote.updatedAt,
            deletedAt: null,
        })
    }

    if (newest) writeSince(userId, newest)
    lastSyncedAt.value = new Date().toISOString()
    return pulled
}

/**
 * Messages of a conversation this device has never opened. Called when one is opened and nothing
 * is stored locally; with no connection the conversation simply shows as empty.
 */
export async function fetchMessagesIfMissing(conversationId: string) {
    const { currentUserId } = useConversations()
    const userId = currentUserId()
    if (!userId || !navigator.onLine) return false
    if (await hasMessages(conversationId)) return false

    try {
        const response = await $fetch<{ data: any[] }>(`/api/conversations/${conversationId}/messages`)
        for (const m of response.data ?? []) {
            await putMessage({
                id: m.id,
                conversationId,
                userId,
                seq: m.seq ?? 0,
                role: m.role,
                content: m.content,
                status: m.status,
                model: m.model,
                stats: m.stats,
                createdAt: m.createdAt,
            })
        }
        return (response.data ?? []).length > 0
    }
    catch (err: any) {
        logEvent(`fetching messages failed: ${err?.data?.message || err?.message}`)
        return false
    }
}

async function sync() {
    const { currentUserId, refresh, list } = useConversations()
    const userId = currentUserId()
    if (!userId || syncing.value || !navigator.onLine) return

    syncing.value = true
    const queuedBefore = pending.value
    try {
        await push(userId)
        const pulled = await pull(userId)
        await refresh(true)
        lastError.value = null
        backoffMs = 0
        logEvent(`sync ok: ${queuedBefore} sent, ${pulled} received, ${list.value.length} conversations on this device`)
    }
    catch (err: any) {
        lastError.value = err?.data?.message || err?.message || 'Could not sync'
        logEvent(`sync failed: ${lastError.value}`)
        // Try again by ourselves rather than waiting for the user to come back to the app.
        backoffMs = backoffMs ? Math.min(backoffMs * 3, MAX_RETRY_MS) : FIRST_RETRY_MS
        schedule(backoffMs)
        logEvent(`sync: retrying in ${Math.round(backoffMs / 1000)}s`)
    }
    finally {
        syncing.value = false
        const remaining = await listOutbox(userId).catch(() => [])
        pending.value = dedupe(remaining).ops.length
    }
}

/** Collapses the bursts that follow a reply into one run. */
function schedule(delayMs = 1500) {
    if (queued) clearTimeout(queued)
    queued = setTimeout(() => { queued = null; sync() }, delayMs)
}

/** Registers the triggers once: back online, and returning to the app. */
function start() {
    if (listening || !import.meta.client) return
    listening = true
    window.addEventListener('online', () => {
        const userStore = useAfronetUserStore()
        if (userStore.offline) userStore.fetchProfile()
        schedule(500)
    })
    window.addEventListener('focus', () => schedule(2000))
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') schedule(2000)
    })
}

export function useChatSync() {
    return {
        syncing: readonly(syncing),
        pending: readonly(pending),
        lastError: readonly(lastError),
        lastSyncedAt: readonly(lastSyncedAt),
        sync,
        schedule,
        start,
        fetchMessagesIfMissing,
    }
}
