<!-- app/pages/store/storage.vue -->

<!--
  Where the space went, and how to get it back. A downloaded app is two things to the
  phone — its own files, and the data you save inside it — and each is freed by a
  different action with a different cost. Showing them as one number would make "remove
  the app" and "delete my notes" look like the same decision.

  The browser's own storage estimate is read on arrival and shown beside Afronet's
  figures, with the difference explained, because a browser can only report its own quota
  and not the phone's free space.

  ?return=<appId> brings someone back here from a download that did not fit, and offers to
  continue it as soon as there is room.
-->
<template>
  <div>
    <UiPageHeader
      title="Storage"
      description="See what’s using space and free some up. Nothing is ever deleted without your confirmation."
    />

    <div
      v-if="returnApp"
      class="mt-6 flex flex-wrap items-center gap-3 rounded-2xl p-4"
      :class="roomNow ? 'bg-[#eaf3ee] text-[#0b5d3e]' : 'bg-[#faf3e3] text-[#b07f15]'"
    >
      <StoreAppIcon :icon="returnApp.icon" :tone="returnApp.tone" size="sm" />
      <p class="flex-1 text-[13.5px]">
        <template v-if="roomNow">
          <strong>Enough space for {{ returnApp.name }}.</strong> You can continue your download.
        </template>
        <template v-else>
          <strong>{{ returnApp.name }} needs {{ formatMB(needed) }}.</strong> Free up
          {{ formatMB(needed - freeMB) }} more to continue.
        </template>
      </p>
      <UiButton :disabled="!roomNow" @click="install = true">Continue download</UiButton>
    </div>

    <section class="mt-6 rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p class="text-[13px] font-medium text-[#606863]">Available to Afronet</p>
          <p class="mt-1 text-[36px] font-semibold leading-none tracking-tight text-[#121614]">{{ formatMB(freeMB) }}</p>
          <p class="mt-1.5 text-[13px] text-[#606863]">
            Afronet is using <strong class="text-[#121614]">{{ formatMB(usedMB) }}</strong> for
            {{ rows.length }} {{ rows.length === 1 ? 'app' : 'apps' }}.
          </p>
        </div>
        <StoreDemoTag label="Simulated device" />
      </div>

      <div class="mt-5">
        <StoreStorageBar :total="capacity" :segments="totals" />
      </div>

      <p class="mt-5 flex items-start gap-1.5 border-t border-[#e4e4de] pt-4 text-[12.5px] text-[#606863]">
        <i class="fa-solid fa-circle-info mt-0.5 shrink-0 text-[11px]" aria-hidden="true"></i>
        <span v-if="estimate === 'pending'">Reading the browser’s storage estimate…</span>
        <span v-else-if="estimate === 'unavailable'">
          This browser doesn’t share a storage estimate. The figures above are Afronet’s own records.
        </span>
        <span v-else>
          Live browser estimate for this site: {{ formatMB(estimate.usage) }} used of a
          {{ formatMB(estimate.quota) }} quota. Browsers don’t report total phone storage.
        </span>
      </p>
    </section>

    <section class="mt-6 grid gap-x-8 gap-y-3 rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6 sm:grid-cols-2">
      <div v-for="h in help" :key="h.title">
        <p class="text-[13.5px] font-semibold text-[#121614]">{{ h.title }}</p>
        <p class="mt-0.5 text-[12.5px] leading-relaxed text-[#606863]">{{ h.body }}</p>
      </div>
    </section>

    <section class="mt-6">
      <h2 class="px-1 text-[17px] font-semibold tracking-tight text-[#121614]">Apps by size</h2>
      <ul class="mt-3 divide-y divide-[#e4e4de] overflow-hidden rounded-3xl border border-[#e4e4de] bg-[#ffffff]">
        <li v-for="row in rows" :key="row.a.id">
          <div class="flex items-center gap-3 p-4">
            <StoreAppIcon :icon="row.a.icon" :tone="row.a.tone" size="md" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-[14.5px] font-semibold text-[#121614]">{{ row.a.name }}</p>
              <p class="mt-0.5 text-[12px] text-[#606863]">
                v{{ row.i.version }} · {{ row.i.lastUsed ? `used ${timeAgo(row.i.lastUsed)}` : 'never opened' }}
              </p>
            </div>
            <p class="text-[15px] font-semibold text-[#121614]">{{ formatMB(row.total) }}</p>
            <UiIconButton
              :label="`Details for ${row.a.name}`"
              :tone="expanded === row.a.id ? 'active' : 'default'"
              @click="expanded = expanded === row.a.id ? '' : row.a.id"
            >
              <i
                class="fa-solid fa-chevron-down text-[12px] transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                :class="expanded === row.a.id ? 'rotate-180' : ''"
                aria-hidden="true"
              ></i>
            </UiIconButton>
          </div>

          <div v-if="expanded === row.a.id" class="border-t border-[#e4e4de] bg-[#f7f7f4]/60 px-4 py-4">
            <StoreStorageBar :total="row.total" height="sm" :segments="breakdown(row.i)" />
            <div class="mt-4 flex flex-wrap gap-2">
              <UiButton size="sm" variant="secondary" :disabled="!online" @click="navigateTo(`/run/${row.a.id}`)">
                Open
              </UiButton>
              <UiButton size="sm" variant="secondary" :disabled="!row.i.dataMB" @click="ask('data', row.a.id)">
                Delete saved data
              </UiButton>
              <UiButton size="sm" variant="danger" @click="ask('uninstall', row.a.id)">Uninstall</UiButton>
            </div>
          </div>
        </li>

        <li v-if="!rows.length" class="flex items-center gap-3 p-6 text-[13.5px] text-[#606863]">
          <i class="fa-solid fa-hard-drive text-[13px]" aria-hidden="true"></i>
          No apps installed.
        </li>
      </ul>
    </section>

    <StoreConfirmDialog
      v-if="action && target"
      open
      :title="confirmCopy.title"
      :confirm-label="confirmCopy.label"
      @close="action = ''"
      @confirm="run"
    >
      <template v-if="action === 'uninstall'">
        <p>Removes this app’s files ({{ formatMB(target.i.appFilesMB) }}) from Afronet.</p>
        <label
          v-if="target.i.dataMB > 0"
          class="mt-3 flex items-start gap-2.5 rounded-xl border border-[#e4e4de] p-3 text-[#121614]"
        >
          <input type="checkbox" class="mt-0.5 h-4 w-4 accent-[#0b5d3e]" :checked="keepData" @change="keepData = !keepData" />
          <span class="text-[13px]">
            Keep my saved data ({{ formatMB(target.i.dataMB) }}) so it’s there if I reinstall.
            <strong v-if="!keepData" class="text-[#b22c26]">Saved data will be permanently deleted.</strong>
          </span>
        </label>
      </template>
      <p v-else>
        Permanently deletes progress, notes and files saved in this app ({{ formatMB(target.i.dataMB) }}). The app
        stays installed. Anything not yet synced cannot be recovered.
      </p>
    </StoreConfirmDialog>

    <StoreInstallDialog v-if="returnApp" :app-id="returnApp.id" :open="install" @close="install = false" />
  </div>
</template>

<script setup>
import { formatMB, timeAgo } from '~/data/store'

definePageMeta({ layout: 'store' })
useHead({ title: 'Storage · Afronet Apps' })

const route = useRoute()

const { online, freeMB, usedMB, getApp, library, requiredMB, installedTotalMB, uninstall, clearData, notify, hydrateAppData } =
  useAppLibrary()

const help = [
  { title: 'Delete saved data', body: 'Erases progress, notes and files saved inside the app. The app itself stays.' },
  { title: 'Uninstall', body: 'Removes the app from Afronet. You choose whether to keep its saved data.' },
]

const expanded = ref('')
const action = ref('')
const actionFor = ref('')
const keepData = ref(true)
const install = ref(false)

// 'pending' until the browser answers, then its figures or 'unavailable'.
const estimate = ref('pending')

onMounted(async () => {
  // So the saved-data figures reflect what the apps actually kept.
  hydrateAppData()

  if (!navigator.storage?.estimate) {
    estimate.value = 'unavailable'
    return
  }
  try {
    const e = await navigator.storage.estimate()
    estimate.value = { usage: (e.usage ?? 0) / 1048576, quota: (e.quota ?? 0) / 1048576 }
  } catch {
    estimate.value = 'unavailable'
  }
})

const rows = computed(() =>
  library.value.map(({ i, a }) => ({ i, a, total: installedTotalMB(i) })).sort((x, y) => y.total - x.total),
)

const capacity = computed(() => usedMB.value + freeMB.value)

const sum = (key) => rows.value.reduce((total, r) => total + r.i[key], 0)

const totals = computed(() => [
  { label: 'App files', mb: sum('appFilesMB'), tone: 'ink' },
  { label: 'Saved data', mb: sum('dataMB'), tone: 'brand' },
])

const breakdown = (i) => [
  { label: 'App files', mb: i.appFilesMB, tone: 'ink' },
  { label: 'Saved data', mb: i.dataMB, tone: 'brand' },
]

const returnApp = computed(() => getApp(String(route.query.return ?? '')))
const needed = computed(() => (returnApp.value ? requiredMB(returnApp.value) : 0))
const roomNow = computed(() => Boolean(returnApp.value) && freeMB.value >= needed.value)

const target = computed(() => rows.value.find((r) => r.a.id === actionFor.value))

const confirmCopy = computed(() => {
  const name = target.value?.a.name ?? ''
  return action.value === 'uninstall'
    ? { title: `Uninstall ${name}?`, label: 'Uninstall' }
    : { title: `Delete ${name}’s saved data?`, label: 'Delete data' }
})

const ask = (kind, appId) => {
  keepData.value = true
  actionFor.value = appId
  action.value = kind
}

const run = () => {
  const t = target.value
  if (!t) return
  if (action.value === 'uninstall') {
    const freed = t.i.appFilesMB + (keepData.value ? 0 : t.i.dataMB)
    uninstall(t.a.id, !keepData.value)
    notify(`${t.a.name} uninstalled · freed ${formatMB(freed)}.`, 'success')
    return
  }
  clearData(t.a.id)
  notify(`Deleted ${t.a.name}’s saved data.`, 'success')
}
</script>
