<!-- app/pages/chat-stats.vue -->
<template>
  <div class="min-h-screen bg-[#f7f7f4]">
    <!-- Header -->
    <div class="border-b border-[#e4e4de] bg-[#ffffff] px-6 py-5">
      <div class="mx-auto max-w-7xl flex items-center justify-between">
        <div>
          <h1 class="text-[20px] font-semibold text-[#121614]">Chat Stats</h1>
          <p class="mt-0.5 text-[13px] text-[#606863]">User activity across Afronet</p>
        </div>
      </div>
    </div>

    <!-- Body -->
    <div class="mx-auto max-w-7xl px-6 py-8">

      <!-- Error -->
      <div v-if="error" class="flex flex-col items-center justify-center py-24 text-center">
        <p class="text-[14px] text-[#606863]">Something went wrong. Please try refreshing.</p>
      </div>


      <template v-else-if="data">
        <!-- Summary cards -->
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div
            v-for="card in summaryCards"
            :key="card.label"
            class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] px-5 py-4"
          >
            <p class="text-[12px] font-medium text-[#8f9792] uppercase tracking-wide">{{ card.label }}</p>
            <p class="mt-1.5 text-[28px] font-semibold leading-none text-[#121614]">{{ card.value }}</p>
            <p v-if="card.sub" class="mt-1 text-[11px] text-[#8f9792]">{{ card.sub }}</p>
          </div>
        </div>

        <!-- Search + count -->
        <div class="mt-8 flex items-center justify-between gap-4">
          <div class="relative flex-1 max-w-sm">
            <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[12px] text-[#8f9792]" aria-hidden="true"></i>
            <input
              v-model="search"
              type="search"
              placeholder="Search by name, email, or institution…"
              class="h-9 w-full rounded-xl border border-[#e4e4de] bg-[#ffffff] pl-9 pr-3 text-[13px] text-[#121614] placeholder:text-[#8f9792] outline-none focus:border-[#0b5d3e] focus:ring-1 focus:ring-[#0b5d3e]"
            />
          </div>
          <p class="shrink-0 text-[13px] text-[#8f9792]">
            {{ filtered.length }} of {{ data.rows.length }} users
          </p>
        </div>

        <!-- Table -->
        <div class="mt-3 overflow-x-auto rounded-2xl border border-[#e4e4de] bg-[#ffffff]">
          <table class="w-full text-[13px]">
            <thead>
              <tr class="border-b border-[#e4e4de]">
                <th
                  v-for="col in columns"
                  :key="col.key"
                  class="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-[#8f9792] whitespace-nowrap select-none"
                  :class="col.sortable ? 'cursor-pointer hover:text-[#121614]' : ''"
                  @click="col.sortable && toggleSort(col.key)"
                >
                  {{ col.label }}
                  <span v-if="col.sortable" class="ml-1 inline-block w-3">
                    <template v-if="sortKey === col.key">
                      <i :class="sortDir === 'asc' ? 'fa-solid fa-caret-up' : 'fa-solid fa-caret-down'" aria-hidden="true"></i>
                    </template>
                    <template v-else>
                      <i class="fa-solid fa-sort text-[#e4e4de]" aria-hidden="true"></i>
                    </template>
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in paginated"
                :key="row.id"
                class="border-b border-[#f0f0ec] last:border-0 hover:bg-[#fafaf8]"
              >
                <!-- Name -->
                <td class="px-4 py-3 font-medium text-[#121614] whitespace-nowrap">
                  <span class="flex items-center gap-2">
                    {{ row.name || '—' }}
                    <span v-if="row.isAdmin" class="rounded-full bg-[#eaf3ee] px-1.5 py-0.5 text-[10px] font-semibold text-[#0b5d3e]">Admin</span>
                    <span v-if="!row.isActive" class="rounded-full bg-[#fef2f2] px-1.5 py-0.5 text-[10px] font-semibold text-[#dc2626]">Inactive</span>
                  </span>
                </td>
                <!-- Email -->
                <td class="px-4 py-3 text-[#606863]">{{ row.email || '—' }}</td>
                <!-- Institution -->
                <td class="px-4 py-3 text-[#606863] max-w-[180px] truncate">{{ row.institution || '—' }}</td>
                <!-- Country -->
                <td class="px-4 py-3 text-[#606863] whitespace-nowrap">{{ row.country || '—' }}</td>
                <!-- Chats -->
                <td class="px-4 py-3 text-right font-medium text-[#121614]">
                  <span :class="row.chats > 0 ? 'text-[#0b5d3e]' : 'text-[#c4c9c6]'">{{ row.chats }}</span>
                </td>
                <!-- Questions -->
                <td class="px-4 py-3 text-right font-medium text-[#121614]">
                  <span :class="row.questions > 0 ? 'text-[#121614]' : 'text-[#c4c9c6]'">{{ row.questions }}</span>
                </td>
                <!-- AI Replies -->
                <td class="px-4 py-3 text-right font-medium text-[#121614]">
                  <span :class="row.aiReplies > 0 ? 'text-[#121614]' : 'text-[#c4c9c6]'">{{ row.aiReplies }}</span>
                </td>
                <!-- Last active -->
                <td class="px-4 py-3 text-[#606863] whitespace-nowrap">{{ formatDate(row.lastActive) }}</td>
                <!-- Joined -->
                <td class="px-4 py-3 text-[#606863] whitespace-nowrap">{{ formatDate(row.joined) }}</td>
              </tr>

              <tr v-if="filtered.length === 0">
                <td colspan="9" class="px-4 py-12 text-center text-[13px] text-[#8f9792]">No users match your search.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
          <p class="text-[13px] text-[#8f9792]">Page {{ page }} of {{ totalPages }}</p>
          <div class="flex gap-2">
            <button
              :disabled="page === 1"
              class="h-8 w-8 rounded-lg border border-[#e4e4de] bg-[#ffffff] text-[12px] disabled:opacity-40"
              @click="page--"
            >
              <i class="fa-solid fa-chevron-left" aria-hidden="true"></i>
            </button>
            <button
              :disabled="page === totalPages"
              class="h-8 w-8 rounded-lg border border-[#e4e4de] bg-[#ffffff] text-[12px] disabled:opacity-40"
              @click="page++"
            >
              <i class="fa-solid fa-chevron-right" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </template>

      <!-- Loading -->
      <div v-else class="flex items-center justify-center py-24">
        <i class="fa-solid fa-circle-notch fa-spin text-[#0b5d3e] text-[24px]" aria-hidden="true"></i>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const { data, error } = await useFetch<{
  summary: { totalUsers: number; totalChats: number; totalQuestions: number; activeUsers30d: number }
  rows: Array<{
    id: string
    name: string | null
    email: string | null
    institution: string | null
    country: string | null
    isActive: boolean
    isAdmin: boolean
    joined: string
    lastActive: string | null
    chats: number
    questions: number
    aiReplies: number
  }>
}>('/api/admin/chat-stats')

const summaryCards = computed(() => [
  { label: 'Total Users', value: fmt(data.value?.summary.totalUsers), sub: null },
  { label: 'Total Chats', value: fmt(data.value?.summary.totalChats), sub: 'synced to server' },
  { label: 'Total Questions', value: fmt(data.value?.summary.totalQuestions), sub: 'user messages' },
  { label: 'Active (30d)', value: fmt(data.value?.summary.activeUsers30d), sub: 'had activity' },
])

// Search
const search = ref('')
const filtered = computed(() => {
  if (!data.value) return []
  const q = search.value.trim().toLowerCase()
  if (!q) return data.value.rows
  return data.value.rows.filter(r =>
    r.name?.toLowerCase().includes(q) ||
    r.email?.toLowerCase().includes(q) ||
    r.institution?.toLowerCase().includes(q) ||
    r.country?.toLowerCase().includes(q),
  )
})

// Sort
const sortKey = ref<string>('lastActive')
const sortDir = ref<'asc' | 'desc'>('desc')

const columns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'institution', label: 'Institution', sortable: false },
  { key: 'country', label: 'Country', sortable: true },
  { key: 'chats', label: 'Chats', sortable: true },
  { key: 'questions', label: 'Questions', sortable: true },
  { key: 'aiReplies', label: 'AI Replies', sortable: true },
  { key: 'lastActive', label: 'Last Active', sortable: true },
  { key: 'joined', label: 'Joined', sortable: true },
]

function toggleSort(key: string) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'desc'
  }
  page.value = 1
}

const sorted = computed(() => {
  const rows = [...filtered.value]
  const dir = sortDir.value === 'asc' ? 1 : -1
  return rows.sort((a, b) => {
    const av = (a as any)[sortKey.value]
    const bv = (b as any)[sortKey.value]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
})

// Pagination
const page = ref(1)
const PAGE_SIZE = 25

const totalPages = computed(() => Math.max(1, Math.ceil(sorted.value.length / PAGE_SIZE)))
const paginated = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return sorted.value.slice(start, start + PAGE_SIZE)
})

watch(search, () => { page.value = 1 })

// Helpers
function fmt(n?: number) {
  return n == null ? '—' : n.toLocaleString('en')
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>
