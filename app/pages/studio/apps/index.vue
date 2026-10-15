<!-- app/pages/studio/apps/index.vue -->

<!--
  Everything this account has built, from first draft to published. A table on a wide
  screen and stacked rows on a phone, from the same markup.

  Unpublishing and archiving both go through a confirmation that says what happens to the
  people who already have the app — because the answer is "nothing", and a developer who
  does not know that will avoid the button.
-->
<template>
  <div>
    <UiPageHeader title="My Apps" description="Everything you’ve built, from first draft to published.">
      <template #actions>
        <UiButton to="/studio/create">
          <template #icon><i class="fa-solid fa-plus text-[11px]" aria-hidden="true"></i></template>
          Create an app
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="mb-4 mt-6 flex flex-wrap items-center gap-2">
      <div class="relative min-w-[220px] flex-1 sm:max-w-xs">
        <i
          class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#8f9792]"
          aria-hidden="true"
        ></i>
        <UiInput v-model="q" size="sm" aria-label="Search your apps" placeholder="Search your apps" class="pl-10" />
      </div>
      <UiSelect v-model="status" :options="statusOptions" size="sm" aria-label="Filter by status" class="w-[170px]" />
      <UiSelect v-model="sort" :options="sortOptions" size="sm" aria-label="Sort" class="w-[160px]" />
    </div>

    <div class="rounded-3xl border border-[#e4e4de] bg-[#ffffff]">
      <table v-if="list.length" class="w-full text-[13.5px]">
        <thead class="hidden text-left text-[12px] text-[#606863] md:table-header-group">
          <tr class="border-b border-[#e4e4de]">
            <th class="px-5 py-3 font-medium">App</th>
            <th class="px-3 font-medium">Status</th>
            <th class="px-3 font-medium">Price</th>
            <th class="px-3 text-right font-medium">Installs</th>
            <th class="hidden px-3 font-medium lg:table-cell">Rating</th>
            <th class="px-3 font-medium">Updated</th>
            <th class="w-12" />
          </tr>
        </thead>
        <tbody class="divide-y divide-[#e4e4de]">
          <tr
            v-for="a in list"
            :key="a.id"
            class="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:table-row md:p-0"
          >
            <td class="w-full md:w-auto md:px-5 md:py-3">
              <NuxtLink :to="openFor(a)" class="flex items-center gap-3 text-left">
                <StoreAppIcon
                  :icon="a.icon"
                  :tone="a.config.tone"
                  size="sm"
                  :muted="a.status === 'archived'"
                />
                <span class="min-w-0">
                  <span class="block font-semibold text-[#121614]">{{ a.name }}</span>
                  <span class="block max-w-[260px] truncate text-[12px] text-[#606863]">
                    v{{ a.version }} · {{ a.tagline }}
                  </span>
                </span>
              </NuxtLink>
            </td>
            <td class="md:px-3"><StudioStatusBadge :status="a.status" /></td>
            <td class="md:px-3">
              <StorePriceTag :price="a.pricingModel === 'paid' ? a.price : 0" :premium="a.pricingModel === 'freemium'" />
            </td>
            <td class="text-right text-[#121614] md:px-3">
              {{ liveStats(a).installs === null ? '—' : compact(liveStats(a).installs) }}
            </td>
            <td class="hidden lg:table-cell lg:px-3">
              <span v-if="liveStats(a).rating !== null" class="inline-flex items-center gap-1 text-[#121614]">
                <i class="fa-solid fa-star text-[10px] text-[#b07f15]" aria-hidden="true"></i>
                {{ liveStats(a).rating.toFixed(1) }}
              </span>
              <span v-else class="text-[#8f9792]">—</span>
            </td>
            <td class="text-[12.5px] text-[#606863] md:px-3">{{ formatDate(a.updatedAt) }}</td>
            <td class="relative ml-auto md:px-3">
              <UiIconButton
                :label="`Actions for ${a.name}`"
                :tone="menu === a.id ? 'active' : 'default'"
                @click="menu = menu === a.id ? '' : a.id"
              >
                <i class="fa-solid fa-ellipsis text-[13px]" aria-hidden="true"></i>
              </UiIconButton>

              <div
                v-if="menu === a.id"
                class="absolute right-2 top-10 z-20 w-48 rounded-xl border border-[#e4e4de] bg-[#ffffff] p-1 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_12px_28px_-12px_rgba(0,0,0,0.2)]"
              >
                <NuxtLink
                  :to="`/studio/builder/${a.id}`"
                  class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#121614] hover:bg-[#f7f7f4]"
                  @click="menu = ''"
                >
                  <i class="fa-solid fa-pen w-4 text-center text-[11px] text-[#606863]" aria-hidden="true"></i>
                  Edit in builder
                </NuxtLink>
                <NuxtLink
                  :to="`/studio/apps/${a.id}`"
                  class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#121614] hover:bg-[#f7f7f4]"
                  @click="menu = ''"
                >
                  <i class="fa-solid fa-flask w-4 text-center text-[11px] text-[#606863]" aria-hidden="true"></i>
                  Test &amp; publish
                </NuxtLink>
                <button
                  v-if="a.status === 'published'"
                  class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#121614] hover:bg-[#f7f7f4]"
                  @click="ask(a, 'unpublish')"
                >
                  <i class="fa-solid fa-eye-slash w-4 text-center text-[11px] text-[#606863]" aria-hidden="true"></i>
                  Unpublish
                </button>
                <button
                  v-if="a.status !== 'archived'"
                  class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-[#121614] hover:bg-[#f7f7f4]"
                  @click="ask(a, 'archive')"
                >
                  <i class="fa-solid fa-box-archive w-4 text-center text-[11px] text-[#606863]" aria-hidden="true"></i>
                  Archive
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-else class="p-2">
        <UiStatePanel
          v-if="devApps.length"
          title="No apps match"
          body="Try a different status, or clear the search."
        >
          <template #action><UiButton variant="secondary" @click="clearFilters">Clear filters</UiButton></template>
        </UiStatePanel>
        <UiStatePanel
          v-else
          title="No apps yet"
          body="Describe your first idea and Afronet will build a working version you can try."
        >
          <template #action><UiButton to="/studio/wizard">Build with AI</UiButton></template>
        </UiStatePanel>
      </div>
    </div>

    <StoreConfirmDialog
      :open="Boolean(confirm)"
      :title="confirm?.kind === 'unpublish' ? `Unpublish ${confirm.app.name}?` : `Archive ${confirm?.app.name ?? ''}?`"
      :confirm-label="confirm?.kind === 'unpublish' ? 'Unpublish' : 'Archive'"
      @close="confirm = null"
      @confirm="run"
    >
      <p v-if="confirm?.kind === 'unpublish'">
        It disappears from the store for new users. Anyone who already installed or bought it keeps it, and their
        purchase stays restorable.
      </p>
      <p v-else>
        Archived apps are hidden from your list and can’t be published until you restore them. Existing installs keep
        working.
      </p>
    </StoreConfirmDialog>
  </div>
</template>

<script setup>
import { compact, formatDate } from '~/data/store'
import { allStatuses, statusLabel } from '~/data/studio'

definePageMeta({ layout: 'studio' })
useHead({ title: 'My Apps · Afronet Studio' })

const { devApps, withdraw, liveStats } = useStudio()

const q = ref('')
const status = ref('all')
const sort = ref('updated')
const menu = ref('')
const confirm = ref(null)

const statusOptions = [
  { id: 'all', name: 'All statuses' },
  ...allStatuses.map((s) => ({ id: s, name: statusLabel(s) })),
]

const sortOptions = [
  { id: 'updated', name: 'Last updated' },
  { id: 'installs', name: 'Most installs' },
  { id: 'name', name: 'Name' },
]

const list = computed(() => {
  const term = q.value.trim().toLowerCase()
  const filtered = devApps.value.filter(
    (a) => (status.value === 'all' || a.status === status.value) && a.name.toLowerCase().includes(term),
  )
  const sorters = {
    updated: (x, y) => (y.updatedAt > x.updatedAt ? 1 : -1),
    // From the listings, like the column it sorts. Sorting on the build's own copy put every
    // app in the same place, because that copy is always zero.
    installs: (x, y) => (liveStats(y).installs ?? -1) - (liveStats(x).installs ?? -1),
    name: (x, y) => x.name.localeCompare(y.name),
  }
  return [...filtered].sort(sorters[sort.value] ?? sorters.updated)
})

/** A draft belongs in the builder; anything further along belongs on its own page. */
const openFor = (app) => (app.status === 'draft' ? `/studio/builder/${app.id}` : `/studio/apps/${app.id}`)

const clearFilters = () => {
  q.value = ''
  status.value = 'all'
}

const ask = (app, kind) => {
  menu.value = ''
  confirm.value = { app, kind }
}

const run = () => {
  if (!confirm.value) return
  withdraw(confirm.value.app.id, confirm.value.kind)
}
</script>
