<!-- app/components/Ai/BrainPanel.vue -->

<!--
  "My brain": the corrections this account has taught, in the familiar "manage memories" shape —
  a centred dialog (full screen on phones) with search, category filters and a plain list where
  each row can be edited or deleted. Categories are detected automatically. Changes are saved on
  this device at once and reach the account (African ID) when online.
-->
<template>
  <div>
    <button
      type="button"
      aria-label="My brain"
      title="My brain"
      class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
      @click="openPanel"
    >
      <AiIcon name="book" :size="18" />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        enter-from-class="opacity-0"
        leave-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        leave-to-class="opacity-0"
      >
        <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-[#121614]/40 sm:p-6" @click.self="close">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="brain-title"
            class="flex h-full w-full flex-col bg-[#ffffff] sm:h-auto sm:max-h-[min(80vh,44rem)] sm:max-w-2xl sm:rounded-2xl sm:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)]"
            @keydown.esc="close"
          >
            <!-- Header -->
            <header class="flex items-start gap-3 px-5 pb-3 pt-5">
              <div class="min-w-0 flex-1">
                <h2 id="brain-title" class="text-[17px] font-semibold tracking-tight text-[#121614]">My brain</h2>
                <p class="mt-1 text-[13px] leading-relaxed text-[#606863]">
                  Answers you've corrected. When you ask one of these again, AfroIntel gives your answer.
                </p>
              </div>
              <button
                ref="closeEl"
                type="button"
                aria-label="Close"
                class="-mr-1.5 -mt-1 rounded-lg p-2 text-[#606863] hover:bg-[#f7f7f4] hover:text-[#121614]"
                @click="close"
              >
                <AiIcon name="close" :size="18" />
              </button>
            </header>

            <!-- Search and category filters -->
            <div v-if="entries.length" class="border-b border-[#e4e4de] px-5 pb-3">
              <div class="relative">
                <AiIcon name="search" :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f9792]" />
                <input
                  v-model="search"
                  type="search"
                  placeholder="Search"
                  aria-label="Search your brain"
                  class="w-full rounded-xl border border-[#e4e4de] bg-[#ffffff] py-2 pl-9 pr-3 text-[14px] text-[#121614] outline-none transition-colors placeholder:text-[#8f9792] focus:border-[#0b5d3e]"
                />
              </div>
              <div class="no-scrollbar -mx-5 mt-3 flex gap-1.5 overflow-x-auto px-5" role="tablist" aria-label="Categories">
                <button
                  v-for="f in filters"
                  :key="f.key"
                  type="button"
                  role="tab"
                  :aria-selected="filter === f.key"
                  class="shrink-0 rounded-full border px-3 py-1 text-[12px] transition-colors duration-150"
                  :class="filter === f.key
                    ? 'border-[#121614] bg-[#121614] text-[#ffffff]'
                    : 'border-[#e4e4de] text-[#606863] hover:border-[#121614]/30 hover:text-[#121614]'"
                  @click="filter = f.key"
                >
                  {{ f.label }} <span class="opacity-60">{{ f.count }}</span>
                </button>
              </div>
            </div>

            <!-- List -->
            <div class="afro-scroll min-h-0 flex-1 overflow-y-auto">
              <!-- Empty: nothing taught yet -->
              <div v-if="!entries.length" class="flex flex-col items-center px-8 py-14 text-center">
                <span class="grid h-12 w-12 place-items-center rounded-full bg-[#eaf3ee] text-[#0b5d3e]">
                  <AiIcon name="book" :size="20" />
                </span>
                <p class="mt-4 text-[15px] font-medium text-[#121614]">Nothing here yet</p>
                <p class="mt-1.5 max-w-xs text-[13px] leading-relaxed text-[#606863]">
                  When an answer is wrong, tap the pencil under it and type the right one. It's saved
                  here, and used the next time you ask.
                </p>
              </div>

              <p v-else-if="!shown.length" class="px-5 py-10 text-center text-[13px] text-[#606863]">
                No corrections match.
              </p>

              <ul v-else class="divide-y divide-[#e4e4de]">
                <li v-for="e in shown" :key="e.id" class="group px-5 py-3.5">
                  <!-- Editing -->
                  <form v-if="editingId === e.id" @submit.prevent="saveEdit(e.id)">
                    <label class="block text-[12px] font-medium text-[#606863]" :for="`q-${e.id}`">Question</label>
                    <textarea
                      :id="`q-${e.id}`"
                      v-model="draft.question"
                      rows="2"
                      class="mt-1 w-full resize-y rounded-xl border border-[#e4e4de] px-3 py-2 text-[14px] text-[#121614] outline-none focus:border-[#0b5d3e]"
                    />
                    <label class="mt-3 block text-[12px] font-medium text-[#606863]" :for="`a-${e.id}`">Right answer</label>
                    <textarea
                      :id="`a-${e.id}`"
                      v-model="draft.answer"
                      rows="3"
                      class="mt-1 w-full resize-y rounded-xl border border-[#e4e4de] px-3 py-2 text-[14px] text-[#121614] outline-none focus:border-[#0b5d3e]"
                    />
                    <div class="mt-3 flex justify-end gap-2">
                      <button type="button" class="rounded-lg px-3 py-1.5 text-[13px] text-[#606863] hover:bg-[#f7f7f4]" @click="editingId = null">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        class="rounded-lg bg-[#0b5d3e] px-3.5 py-1.5 text-[13px] font-medium text-[#ffffff] hover:opacity-90 disabled:opacity-40"
                        :disabled="!draft.question.trim() || !draft.answer.trim()"
                      >
                        Save
                      </button>
                    </div>
                  </form>

                  <!-- Reading -->
                  <div v-else class="flex items-start gap-3">
                    <div class="min-w-0 flex-1">
                      <p class="text-[14px] font-medium leading-snug text-[#121614]">{{ e.question }}</p>
                      <p class="mt-1 whitespace-pre-wrap text-[14px] leading-relaxed text-[#3d4440]">{{ e.answer }}</p>
                      <p class="mt-1.5 text-[12px] text-[#8f9792]">{{ e.category }} · {{ formatDate(e.updatedAt) }}</p>
                    </div>
                    <!-- Always visible on touch screens; on hover or focus with a mouse. -->
                    <div
                      class="flex shrink-0 items-center gap-0.5 text-[#8f9792] transition-opacity duration-150 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
                      :class="confirmId === e.id ? '!opacity-100' : ''"
                    >
                      <button
                        v-if="confirmId !== e.id"
                        type="button"
                        aria-label="Edit"
                        title="Edit"
                        class="rounded-md p-1.5 hover:bg-[#f7f7f4] hover:text-[#121614]"
                        @click="startEdit(e)"
                      >
                        <AiIcon name="edit" :size="15" />
                      </button>
                      <button
                        v-if="confirmId === e.id"
                        type="button"
                        class="rounded-md px-2 py-1 text-[12px] text-[#606863] hover:bg-[#f7f7f4]"
                        @click="confirmId = null"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        :aria-label="confirmId === e.id ? 'Confirm delete' : 'Delete'"
                        :title="confirmId === e.id ? 'Confirm delete' : 'Delete'"
                        class="rounded-md hover:bg-[#f7f7f4]"
                        :class="confirmId === e.id ? 'bg-[#b22c26]/10 px-2 py-1 text-[12px] font-medium text-[#b22c26] hover:bg-[#b22c26]/15' : 'p-1.5 hover:text-[#b22c26]'"
                        @click="deleteEntry(e.id)"
                      >
                        <template v-if="confirmId === e.id">Delete</template>
                        <AiIcon v-else name="trash" :size="15" />
                      </button>
                    </div>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Footer: where these live -->
            <footer class="flex items-center gap-2 border-t border-[#e4e4de] px-5 py-3 text-[12px] text-[#606863]">
              <span class="h-1.5 w-1.5 shrink-0 rounded-full" :class="syncState.dot" />
              <span class="min-w-0 flex-1 truncate">{{ syncState.text }}</span>
              <span class="shrink-0 tabular-nums text-[#8f9792]">{{ entries.length }} saved</span>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const { entries, load, update, remove } = useBrain()
const { pending, lastError } = useChatSync()
const online = useOnline()

const open = ref(false)
const search = ref('')
const filter = ref('all')
const editingId = ref(null)
const draft = reactive({ question: '', answer: '' })
const confirmId = ref(null)
const closeEl = ref(null)

const openPanel = async () => {
  open.value = true
  search.value = ''
  filter.value = 'all'
  await load()
  await nextTick()
  closeEl.value?.focus() // so Escape and keyboard navigation work straight away
}

const close = () => {
  open.value = false
  editingId.value = null
  confirmId.value = null
}

const formatDate = iso => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })

const sorted = computed(() => entries.value.slice().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))

/** "All" plus each category that has something in it, biggest first. */
const filters = computed(() => {
  const counts = new Map()
  for (const e of entries.value) counts.set(e.category, (counts.get(e.category) ?? 0) + 1)
  const categories = [...counts].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, label: key, count }))
  return [{ key: 'all', label: 'All', count: entries.value.length }, ...categories]
})

// A filter whose last entry was deleted falls back to All.
watch(filters, (list) => {
  if (!list.some(f => f.key === filter.value)) filter.value = 'all'
})

const shown = computed(() => {
  const q = search.value.trim().toLowerCase()
  return sorted.value.filter(e =>
    (filter.value === 'all' || e.category === filter.value)
    && (!q || `${e.question} ${e.answer}`.toLowerCase().includes(q)))
})

const syncState = computed(() => {
  if (pending.value) return { dot: 'bg-[#b07f15]', text: `${pending.value} change${pending.value === 1 ? '' : 's'} waiting to sync to your African ID` }
  if (!online.value) return { dot: 'bg-[#8f9792]', text: 'Offline — changes sync when you reconnect' }
  if (lastError.value) return { dot: 'bg-[#b07f15]', text: "Couldn't sync yet — will try again" }
  return { dot: 'bg-[#0b5d3e]', text: 'Saved to your African ID' }
})

const startEdit = (e) => {
  confirmId.value = null
  Object.assign(draft, { question: e.question, answer: e.answer })
  editingId.value = e.id
}

const saveEdit = async (id) => {
  await update(id, { ...draft })
  editingId.value = null
}

// Two steps, no browser dialog: a confirm() would block the page.
const deleteEntry = async (id) => {
  if (confirmId.value !== id) {
    confirmId.value = id
    return
  }
  confirmId.value = null
  await remove(id)
}
</script>
