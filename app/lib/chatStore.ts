// app/lib/chatStore.ts
//
// Conversations and messages saved on the device, in IndexedDB.
//
// Local-first: every write lands here immediately, so the chat works with no connection and
// survives reloads. The `outbox` store holds pending server operations in order; it is created
// now and filled in the sync phase, so no database upgrade is needed then.
//
// Ids are uuids generated on this device, which is what lets a conversation created offline be
// uploaded later without creating a duplicate. Records are stored per user id, so two accounts on
// one device never see each other's chats.

import type { GenerateStats } from './llm'

const DB_NAME = 'afronet'
const DB_VERSION = 1

export const CONVERSATIONS = 'conversations'
export const MESSAGES = 'messages'
export const OUTBOX = 'outbox'

export interface StoredConversation {
    id: string
    userId: string
    title: string
    /** ISO timestamps: comparable as strings and ready to send to the server. */
    createdAt: string
    updatedAt: string
    /** Soft delete, so a deletion can reach the user's other devices later. */
    deletedAt: string | null
}

export interface StoredMessage {
    id: string
    conversationId: string
    userId: string
    /**
     * Position within the conversation, counted from 0. A question and its reply are created in
     * the same millisecond, so timestamps alone tie and the order comes out shuffled on reload.
     * This also keeps the order stable once conversations sync between devices.
     */
    seq: number
    role: 'user' | 'assistant'
    content: string
    status: 'done' | 'stopped' | 'error'
    /** Which model wrote an assistant reply. */
    model?: string
    stats?: GenerateStats
    createdAt: string
}

/** A server operation waiting to be sent (filled in the sync phase). */
export interface OutboxOp {
    seq?: number
    userId: string
    kind: 'conversation' | 'message'
    id: string
    conversationId?: string
    createdAt: string
}

export function newId() {
    try { return crypto.randomUUID() }
    catch { return `${Date.now()}-${Math.random().toString(36).slice(2)}` }
}

export const nowIso = () => new Date().toISOString()

/**
 * IndexedDB stores data by structured clone, which throws on Vue's reactive proxies — a reply
 * carrying its stats object would silently fail to save. Everything stored here is plain JSON
 * (strings, numbers, booleans), so a round trip gives a clean copy. Undefined fields drop out,
 * which is what we want for optional ones like model and stats.
 */
function plain<T>(value: T): T {
    return JSON.parse(JSON.stringify(value))
}

let dbPromise: Promise<IDBDatabase> | null = null

function openDb() {
    dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)
        request.onupgradeneeded = () => {
            const db = request.result
            if (!db.objectStoreNames.contains(CONVERSATIONS)) {
                const store = db.createObjectStore(CONVERSATIONS, { keyPath: 'id' })
                store.createIndex('userId', 'userId')
            }
            if (!db.objectStoreNames.contains(MESSAGES)) {
                const store = db.createObjectStore(MESSAGES, { keyPath: 'id' })
                store.createIndex('conversationId', 'conversationId')
                store.createIndex('userId', 'userId')
            }
            if (!db.objectStoreNames.contains(OUTBOX)) {
                db.createObjectStore(OUTBOX, { keyPath: 'seq', autoIncrement: true })
            }
        }
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error ?? new Error('Could not open device storage'))
        request.onblocked = () => reject(new Error('Device storage is busy in another tab'))
    }).catch((err) => {
        dbPromise = null // let the next call try again (private mode, quota, closed tab)
        throw err
    })
    return dbPromise
}

/** Runs one transaction and resolves with the request's result once it has committed. */
function run<T>(store: string, mode: IDBTransactionMode, body: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    return openDb().then(db => new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const request = body(tx.objectStore(store))
        let result: T
        request.onsuccess = () => { result = request.result }
        tx.oncomplete = () => resolve(result)
        tx.onabort = () => reject(tx.error ?? new Error('Device storage write failed'))
        tx.onerror = () => reject(tx.error ?? new Error('Device storage write failed'))
    }))
}

/** Newest first, deleted ones left out. */
export async function listConversations(userId: string): Promise<StoredConversation[]> {
    const all = await run<StoredConversation[]>(CONVERSATIONS, 'readonly', s => s.index('userId').getAll(userId))
    return all
        .filter(c => !c.deletedAt)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export function getConversation(id: string) {
    return run<StoredConversation | undefined>(CONVERSATIONS, 'readonly', s => s.get(id))
}

export function putConversation(conversation: StoredConversation) {
    return run(CONVERSATIONS, 'readwrite', s => s.put(plain(conversation)))
}

/** Oldest first — the order they are shown and sent to the model. */
export async function listMessages(conversationId: string): Promise<StoredMessage[]> {
    const all = await run<StoredMessage[]>(MESSAGES, 'readonly', s => s.index('conversationId').getAll(conversationId))
    return all.sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0) || a.createdAt.localeCompare(b.createdAt))
}

export function putMessage(message: StoredMessage) {
    return run(MESSAGES, 'readwrite', s => s.put(plain(message)))
}

export async function deleteMessagesOf(conversationId: string) {
    const messages = await listMessages(conversationId)
    for (const m of messages) await run(MESSAGES, 'readwrite', s => s.delete(m.id))
}

export function getMessage(id: string) {
    return run<StoredMessage | undefined>(MESSAGES, 'readonly', s => s.get(id))
}

export async function hasMessages(conversationId: string) {
    const all = await run<StoredMessage[]>(MESSAGES, 'readonly', s => s.index('conversationId').getAll(conversationId))
    return all.length > 0
}

/** A conversation deleted elsewhere: nothing to keep on this device. */
export async function hardDeleteConversation(id: string) {
    await deleteMessagesOf(id)
    await run(CONVERSATIONS, 'readwrite', s => s.delete(id))
}

/** Pending server operations, oldest first. */
export async function listOutbox(userId: string): Promise<OutboxOp[]> {
    const all = await run<OutboxOp[]>(OUTBOX, 'readonly', s => s.getAll())
    return all.filter(op => op.userId === userId).sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
}

export function deleteOp(seq: number) {
    return run(OUTBOX, 'readwrite', s => s.delete(seq))
}

/** Queued for the server, flushed by the sync layer when there is a connection. */
export function queueOp(op: OutboxOp) {
    return run(OUTBOX, 'readwrite', s => s.put(plain(op))).catch(() => {
        // Never let a queueing problem break the chat itself.
    })
}

/** Everything belonging to one account — used on sign-out, since devices are shared. */
export async function clearUserData(userId: string) {
    const conversations = await run<StoredConversation[]>(CONVERSATIONS, 'readonly', s => s.index('userId').getAll(userId))
    const messages = await run<StoredMessage[]>(MESSAGES, 'readonly', s => s.index('userId').getAll(userId))
    for (const m of messages) await run(MESSAGES, 'readwrite', s => s.delete(m.id))
    for (const c of conversations) await run(CONVERSATIONS, 'readwrite', s => s.delete(c.id))
    const ops = await run<OutboxOp[]>(OUTBOX, 'readonly', s => s.getAll())
    for (const op of ops) {
        if (op.userId === userId && op.seq !== undefined) await run(OUTBOX, 'readwrite', s => s.delete(op.seq!))
    }
}

/** First line of the first question, which is what the sidebar shows. */
export function titleFrom(text: string) {
    const line = text.trim().split('\n')[0] ?? ''
    return line.length > 60 ? `${line.slice(0, 57).trimEnd()}…` : line || 'New chat'
}
