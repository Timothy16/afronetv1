<!-- app/components/Ai/ConversationList.vue -->

<!-- Past conversations, read from device storage. Select, rename and delete; new chat on top. -->
<template>
  <div class="flex h-full min-h-0 flex-col bg-[#ffffff]">
    <div class="flex items-center justify-between gap-2 p-3">
      <UiButton size="sm" variant="secondary" :disabled="generating" @click="emit('new')">
        <template #icon><AiIcon name="plus" :size="14" /></template>
        New chat
      </UiButton>
      <button
        type="button"
        aria-label="Close conversations"
        class="rounded-lg p-2 text-[#8f9792] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] md:hidden"
        @click="emit('close')"
      >
        <AiIcon name="close" :size="16" />
      </button>
    </div>

    <div class="afro-scroll min-h-0 flex-1 overflow-y-auto px-2 pb-3">
      <p class="px-2 pb-1.5 pt-2 text-[11px] font-medium uppercase tracking-wide text-[#8f9792]">Conversations</p>

      <p v-if="loading && !list.length" class="px-2 py-2 text-[12px] text-[#8f9792]">Loading…</p>
      <p v-else-if="storageError" class="px-2 py-2 text-[12px] text-[#b22c26]">
        Conversations can't be saved on this device: {{ storageError }}
      </p>
      <p v-else-if="!list.length" class="px-2 py-2 text-[12px] text-[#8f9792]">
        Nothing here yet. Your chats are saved on this device.
      </p>

      <div v-for="c in list" :key="c.id" class="group relative">
        <!-- Renaming turns the row into an input. -->
        <input
          v-if="renamingId === c.id"
          ref="renameInput"
          v-model="renameValue"
          class="my-0.5 w-full rounded-lg border border-[#0b5d3e] px-2 py-2 text-[13px] text-[#121614] focus:outline-none"
          @keydown.enter="commitRename(c.id)"
          @keydown.esc="renamingId = null"
          @blur="commitRename(c.id)"
        />

        <div
          v-else
          class="flex items-center gap-1 rounded-lg transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="c.id === activeId ? 'bg-[#f7f7f4]' : 'hover:bg-[#f7f7f4]'"
        >
          <button
            class="min-w-0 flex-1 truncate px-2 py-2 text-left text-[13px]"
            :class="c.id === activeId ? 'font-medium text-[#121614]' : 'text-[#606863]'"
            @click="emit('select', c.id)"
          >
            {{ c.title }}
          </button>
          <button
            :aria-label="`Options for ${c.title}`"
            class="mr-1 rounded-md p-1.5 text-[#8f9792] opacity-0 transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614] focus:opacity-100 group-hover:opacity-100"
            :class="menuId === c.id ? 'opacity-100' : ''"
            @click="menuId = menuId === c.id ? null : c.id"
          >
            <AiIcon name="menu" :size="14" />
          </button>
        </div>

        <!-- Options: rename, or confirm a delete in place. -->
        <div v-if="menuId === c.id" class="mb-1 ml-2 flex items-center gap-3 px-2 pb-1 text-[12px]">
          <template v-if="confirmId === c.id">
            <span class="text-[#606863]">Delete this chat?</span>
            <button class="font-medium text-[#b22c26] hover:underline" @click="confirmDelete(c.id)">Delete</button>
            <button class="text-[#606863] hover:text-[#121614]" @click="confirmId = null">Cancel</button>
          </template>
          <template v-else>
            <button class="text-[#606863] hover:text-[#121614]" @click="startRename(c)">Rename</button>
            <button class="text-[#b22c26] hover:underline" @click="confirmId = c.id">Delete</button>
          </template>
        </div>
      </div>
    </div>

    <p class="border-t border-[#e4e4de] px-4 py-3 text-[11px] leading-relaxed text-[#8f9792]">
      <template v-if="syncing">Saving to your account…</template>
      <template v-else-if="pending > 0">
        Saved on this device · {{ pending }} waiting to sync
      </template>
      <template v-else>Saved on this device and your account.</template>
    </p>
  </div>
</template>

<script setup>
defineProps({
  activeId: { type: String, default: null },
  generating: { type: Boolean, default: false },
})

const emit = defineEmits(['select', 'new', 'close'])

const { list, loading, storageError, rename, remove } = useConversations()
const { syncing, pending } = useChatSync()

const menuId = ref(null)
const confirmId = ref(null)
const renamingId = ref(null)
const renameValue = ref('')
const renameInput = ref(null)

const startRename = async (conversation) => {
  renamingId.value = conversation.id
  renameValue.value = conversation.title
  menuId.value = null
  await nextTick()
  const el = Array.isArray(renameInput.value) ? renameInput.value[0] : renameInput.value
  el?.focus()
  el?.select()
}

const commitRename = async (id) => {
  if (renamingId.value !== id) return
  const value = renameValue.value
  renamingId.value = null
  await rename(id, value)
}

const confirmDelete = async (id) => {
  confirmId.value = null
  menuId.value = null
  await remove(id)
  emit('select', null) // the open chat may have been the deleted one
}
</script>
