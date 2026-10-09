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

/** 4xx means the server will never accept this item; anything else is worth retrying. */
function isPermanent(err: any) {
    const status = err?.statusCode ?? err?.response?.status ?? 0
    return status >= 400 && status < 500 && status !== 408 && status !== 429
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
    const since = readSince(userId)
    const response = await $fetch<{ data: Array<StoredConversation & { id: string }> }>('/api/conversations', {
        query: since ? { since } : undefined,
    })

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
    const { currentUserId, refresh } = useConversations()
    const userId = currentUserId()
    if (!userId || syncing.value || !navigator.onLine) return

    syncing.value = true
    try {
        await push(userId)
        await pull(userId)
        await refresh(true)
        lastError.value = null
    }
    catch (err: any) {
        lastError.value = err?.data?.message || err?.message || 'Could not sync'
        logEvent(`sync failed: ${lastError.value}`)
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
