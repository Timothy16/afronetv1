<!-- app/pages/store/my-apps.vue -->

<!--
  Everything this account has installed or bought, in five views: what is here, what can be
  updated, what is still downloading, what has been paid for, and what was used recently.

  Two decisions worth keeping: an app that needs internet is shown with "Needs internet"
  instead of a dead Open button, and uninstalling asks separately about saved data, because
  deleting someone's progress is not the same as removing an app.
-->
<template>
  <div>
    <UiPageHeader title="My Apps" description="Everything you’ve installed or bought on this account.">
      <template v-if="updates.length > 1" #actions>
        <UiButton @click="updateAll">Update all ({{ updates.length }})</UiButton>
      </template>
    </UiPageHeader>

    <div class="mt-6 overflow-x-auto pb-1">
      <UiSegmentedControl v-model="tab" :options="tabs" size="sm" />
    </div>

    <div class="mt-4 overflow-hidden rounded-3xl border border-[#e4e4de] bg-[#ffffff]">
      <!-- Installed, and recently used: the same row, ordered differently ---->
      <ul v-if="tab === 'installed' || tab === 'recent'" class="divide-y divide-[#e4e4de]">
        <li v-for="{ a, i } in tab === 'installed' ? library : recent" :key="a.id" class="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
          <StoreAppIcon :icon="a.icon" :tone="a.tone" size="md" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[14.5px] font-semibold text-[#121614]">{{ a.name }}</p>
            <p class="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[#606863]">
              <span>v{{ i.version }}</span>
              <span>{{ formatMB(installedTotalMB(i)) }}</span>
              <span>{{ i.lastUsed ? `Used ${timeAgo(i.lastUsed)}` : 'Not opened yet' }}</span>
            </p>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <UiButton v-if="hasUpdate(a.id)" size="sm" @click="updateNow(a.id)">
              <template #icon><i class="fa-solid fa-rotate text-[11px]" aria-hidden="true"></i></template>
              Update
            </UiButton>
            <UiButton size="sm" :disabled="!online" @click="navigateTo(`/run/${a.id}`)">
              {{ online ? 'Open' : 'Needs a connection' }}
            </UiButton>
            <UiIconButton :label="`Uninstall ${a.name}`" @click="askRemove(a.id)">
              <i class="fa-solid fa-trash-can text-[12px]" aria-hidden="true"></i>
            </UiIconButton>
          </div>
        </li>
        <li v-if="!(tab === 'installed' ? library : recent).length" class="p-2">
          <UiStatePanel
            :title="tab === 'installed' ? 'No apps installed' : 'Nothing used recently'"
            :body="
              tab === 'installed'
                ? 'Apps you download appear here and open even without internet.'
                : 'Apps you open will show up here.'
            "
          >
            <template v-if="tab === 'installed'" #action><UiButton to="/store">Browse apps</UiButton></template>
          </UiStatePanel>
        </li>
      </ul>

      <!-- Updates ---------------------------------------------------------->
      <ul v-else-if="tab === 'updates'" class="divide-y divide-[#e4e4de]">
        <li v-for="{ a, i } in updates" :key="a.id" class="p-4">
          <div class="flex flex-wrap items-center gap-3">
            <StoreAppIcon :icon="a.icon" :tone="a.tone" size="md" />
            <div class="min-w-0 flex-1">
              <p class="text-[14.5px] font-semibold text-[#121614]">
                {{ a.name }}
                <UiBadge v-if="a.changelog[0]?.mandatory" tone="danger">Required security update</UiBadge>
              </p>
              <p class="text-[12.5px] text-[#606863]">
                {{ i.version }} → <strong class="text-[#121614]">{{ a.version }}</strong> ·
                {{ formatMB(a.downloadMB) }} update
              </p>
            </div>
            <div class="flex gap-1.5">
              <UiButton v-if="!a.changelog[0]?.mandatory" variant="ghost" size="sm" @click="remindLater(a, i)">
                Later
              </UiButton>
              <UiButton size="sm" @click="updateNow(a.id)">Update now</UiButton>
            </div>
          </div>
          <div class="mt-3 rounded-xl bg-[#f7f7f4] p-3 text-[13px]">
            <p class="font-medium text-[#121614]">What’s new</p>
            <p class="mt-0.5 text-[#606863]">{{ a.changelog[0]?.notes }}</p>
            <p class="mt-1.5 text-[12px] text-[#8f9792]">
              Your saved data is kept.
              {{
                a.changelog[0]?.mandatory
                  ? 'This update fixes a security issue and is required to keep using the app online.'
                  : `Version ${i.version} keeps working until you update.`
              }}
            </p>
          </div>
        </li>
        <li v-if="!updates.length" class="p-2">
          <UiStatePanel
            kind="success"
            title="All apps are up to date"
            body="Afronet checks for updates each time you open the store."
          />
        </li>
      </ul>

      <!-- Downloads -------------------------------------------------------->
      <ul v-else-if="tab === 'downloads'" class="divide-y divide-[#e4e4de]">
        <li v-for="d in active" :key="d.appId" class="flex flex-wrap items-center gap-3 p-4">
          <StoreAppIcon :icon="appFor(d.appId).icon" :tone="appFor(d.appId).tone" size="md" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[14.5px] font-semibold text-[#121614]">{{ appFor(d.appId).name }}</p>
            <div class="mt-2"><UiProgress :value="d.progress" :tone="d.status === 'paused' ? 'gold' : 'brand'" /></div>
            <p class="mt-1 text-[12px] text-[#606863]">
              {{
                d.status === 'failed'
                  ? d.error
                  : d.status === 'verifying'
                    ? 'Verifying…'
                    : `${Math.round(d.progress)}% · ${d.status}`
              }}
            </p>
          </div>
          <div class="flex gap-1.5">
            <UiButton v-if="d.status === 'downloading'" variant="secondary" size="sm" @click="pauseDownload(d.appId)">
              Pause
            </UiButton>
            <UiButton
              v-if="d.status === 'paused' || d.status === 'failed'"
              variant="secondary"
              size="sm"
              @click="resumeDownload(d.appId)"
            >
              Resume
            </UiButton>
            <UiButton variant="ghost" size="sm" @click="cancelDownload(d.appId)">Cancel</UiButton>
          </div>
        </li>
        <li v-if="!active.length" class="p-2">
          <UiStatePanel
            title="No downloads in progress"
            body="Active and interrupted downloads appear here so you can resume them."
          />
        </li>
      </ul>

      <!-- Purchased -------------------------------------------------------->
      <ul v-else class="divide-y divide-[#e4e4de]">
        <li v-for="p in owned" :key="p.id" class="flex flex-wrap items-center gap-3 p-4">
          <StoreAppIcon :icon="appFor(p.appId).icon" :tone="appFor(p.appId).tone" size="md" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[14.5px] font-semibold text-[#121614]">{{ appFor(p.appId).name }}</p>
            <p class="text-[12px] text-[#606863]">
              {{ formatNaira(p.amount) }} · {{ formatDate(p.date) }} · {{ p.ref }}
            </p>
          </div>
          <span v-if="getInstalled(p.appId)" class="text-[12.5px] font-medium text-[#0b5d3e]">Installed</span>
          <UiButton v-else variant="secondary" size="sm" :disabled="!online" @click="installFor = p.appId">
            <template #icon><i class="fa-solid fa-download text-[11px]" aria-hidden="true"></i></template>
            Download
          </UiButton>
        </li>
        <li v-if="!owned.length" class="p-2">
          <UiStatePanel
            title="No purchases yet"
            body="Paid apps you buy are linked to your account and can be restored on any device."
          />
        </li>
      </ul>
    </div>

    <NuxtLink
      v-if="tab === 'installed' && library.length"
      to="/store/storage"
      class="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0b5d3e] hover:underline"
    >
      Manage storage
      <i class="fa-solid fa-arrow-right text-[10px]" aria-hidden="true"></i>
    </NuxtLink>

    <StoreInstallDialog v-if="installFor" :app-id="installFor" open @close="installFor = ''" />

    <StoreConfirmDialog
      :open="Boolean(removing)"
      :title="`Uninstall ${removing?.a.name ?? ''}?`"
      confirm-label="Uninstall"
      @close="remove = ''"
      @confirm="doRemove"
    >
      <template v-if="removing">
        <p>
          This removes the app’s files ({{ formatMB(removing.i.appFilesMB) }}). You can download it again any
          time<span v-if="removing.a.price">
            — your purchase stays on your account</span
          >.
        </p>
        <label
          v-if="removing.i.dataMB > 0"
          class="mt-3 flex items-start gap-2.5 rounded-xl border border-[#e4e4de] p-3 text-[#121614]"
        >
          <input type="checkbox" class="mt-0.5 h-4 w-4 accent-[#b22c26]" :checked="deleteData" @change="deleteData = !deleteData" />
          <span class="text-[13px]">
            Also delete saved data ({{ formatMB(removing.i.dataMB) }}) — progress, notes and recordings on this device.
            <strong>This can’t be undone.</strong>
          </span>
        </label>
      </template>
    </StoreConfirmDialog>
  </div>
</template>

<script setup>
import { formatDate, formatMB, formatNaira, timeAgo } from '~/data/store'

definePageMeta({ layout: 'store' })
useHead({ title: 'My Apps · Afronet Apps' })

const route = useRoute()

const {
  online,
  getApp,
  library,
  updates,
  downloads,
  purchases,
  getInstalled,
  hasUpdate,
  installedTotalMB,
  startDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
  uninstall,
  notify,
} = useAppLibrary()

// Seeded from the address so a notification can link straight to the updates list.
const tab = ref(['installed', 'updates', 'downloads', 'purchased', 'recent'].includes(String(route.query.tab))
  ? String(route.query.tab)
  : 'installed')

const installFor = ref('')
const remove = ref('')
const deleteData = ref(false)

const tabs = computed(() => [
  { value: 'installed', label: `Installed · ${library.value.length}` },
  { value: 'updates', label: `Updates · ${updates.value.length}` },
  { value: 'downloads', label: `Downloads · ${active.value.length}` },
  { value: 'purchased', label: `Purchased · ${purchases.value.length}` },
  { value: 'recent', label: 'Recently used' },
])

const active = computed(() => Object.values(downloads.value))
const owned = computed(() => purchases.value.filter((p) => getApp(p.appId)))

const recent = computed(() =>
  library.value.filter(({ i }) => i.lastUsed).sort((x, y) => (y.i.lastUsed > x.i.lastUsed ? 1 : -1)),
)

const removing = computed(() => library.value.find(({ a }) => a.id === remove.value))

const appFor = (id) => getApp(id)

const updateNow = (id) => {
  if (!online.value) {
    notify('Update needs a connection. Your current version keeps working — try again when you’re online.', 'error')
    return
  }
  installFor.value = id
}

const updateAll = () => {
  if (!online.value) {
    notify('Updates need a connection. Try again when you’re online.', 'error')
    return
  }
  updates.value.forEach(({ a }) => startDownload(a.id, 'update'))
  tab.value = 'downloads'
}

// Nothing is scheduled — the update simply stays in this list. Saying so beats promising a
// reminder that nothing sends.
const remindLater = (a, i) =>
  notify(`${a.name} ${i.version} keeps working · the update stays here when you want it.`)

const askRemove = (id) => {
  deleteData.value = false
  remove.value = id
}

const doRemove = () => {
  const target = removing.value
  if (!target) return
  const freed = target.i.appFilesMB + (deleteData.value ? target.i.dataMB : 0)
  const keptData = !deleteData.value && target.i.dataMB > 0
  uninstall(target.a.id, deleteData.value)
  notify(
    `${target.a.name} uninstalled · freed ${formatMB(freed)}.${keptData ? ' Your saved data was kept.' : ''}`,
    'success',
  )
}
</script>
