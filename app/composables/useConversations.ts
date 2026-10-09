// app/composables/useConversations.ts
import {
    clearUserData,
    deleteMessagesOf,
    getConversation,
    listConversations,
    nowIso,
    putConversation,
    queueOp,
    type StoredConversation,
} from '~/lib/chatStore'
import { logEvent } from '~/lib/crashlog'
import { forgetSince } from '~/composables/useChatSync'
import { useAfronetUserStore } from '~/stores/afronetUser'

const list = ref<StoredConversation[]>([])
const loading = ref(false)
const storageError = ref<string | null>(null)
let loadedFor: string | null = null

/** The signed-in account; chats are stored per user because devices are shared. */
function currentUserId() {
    const user = useAfronetUserStore().user
    return user?._id ?? null
}

async function refresh(force = false) {
    const userId = currentUserId()
    if (!userId) return
    if (!force && loadedFor === userId) return
    loading.value = true
    try {
        list.value = await listConversations(userId)
        loadedFor = userId
        storageError.value = null
    }
    catch (err) {
        storageError.value = err instanceof Error ? err.message : String(err)
        logEvent(`conversation list failed: ${storageError.value}`)
    }
    finally {
        loading.value = false
    }
}

/** Called after a message is added, to keep the sidebar order and title current. */
async function touch(conversation: StoredConversation) {
    await putConversation(conversation)
    const rest = list.value.filter(c => c.id !== conversation.id)
    list.value = [conversation, ...rest].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

async function rename(id: string, title: string) {
    const conversation = await getConversation(id)
    const clean = title.trim()
    if (!conversation || !clean) return
    const updated = { ...conversation, title: clean.slice(0, 120), updatedAt: nowIso() }
    await touch(updated)
    await queueOp({ userId: updated.userId, kind: 'conversation', id: updated.id, createdAt: nowIso() })
}

/**
 * Soft delete: the record stays with a deletedAt so the deletion can reach the user's other
 * devices later. The messages are removed from this device to free space.
 */
async function remove(id: string) {
    const conversation = await getConversation(id)
    if (!conversation) return
    await putConversation({ ...conversation, deletedAt: nowIso(), updatedAt: nowIso() })
    await deleteMessagesOf(id)
    list.value = list.value.filter(c => c.id !== id)
    await queueOp({ userId: conversation.userId, kind: 'conversation', id, createdAt: nowIso() })
    logEvent('conversation deleted')
}

/** Sign-out on a shared device: nothing of this account stays behind. */
async function clearLocal(userId: string) {
    await clearUserData(userId).catch(err => logEvent(`clearing local chats failed: ${err}`))
    forgetSince(userId)
    list.value = []
    loadedFor = null
}

export function useConversations() {
    return {
        list: readonly(list),
        loading: readonly(loading),
        storageError: readonly(storageError),
        currentUserId,
        refresh,
        touch,
        rename,
        remove,
        clearLocal,
    }
}
