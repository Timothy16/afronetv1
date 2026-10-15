<!-- app/components/Store/InstallDialog.vue -->

<!--
  Everything between tapping Get and having the app on the device. It is one dialog with
  five faces, because they are five moments in one job:

    blocked   there is not enough room — says by how much, and what would free it
    precheck  the honest numbers before anything is downloaded
    progress  downloading, then verifying the package
    failed    interrupted, or the signature did not match
    done      installed, with what it can do offline

  The guide asks for two things this screen is built around: tell people the real size
  before they spend data on it, and never install a package that failed verification.
-->
<template>
  <UiModal v-if="app" :open="open" :title="heading" @close="emit('close')">
    <!-- Not enough storage ------------------------------------------------>
    <div v-if="phase === 'blocked'">
      <div class="flex items-start gap-3 rounded-2xl bg-[#b22c26]/10 p-4 text-[#b22c26]">
        <i class="fa-solid fa-hard-drive mt-0.5 text-[16px]" aria-hidden="true"></i>
        <div>
          <p class="text-[15px] font-semibold">Not enough storage to install this app</p>
          <p class="mt-0.5 text-[13px]">Installing needs room for the package and the unpacked app at the same time.</p>
        </div>
      </div>

      <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-xl border border-[#e4e4de] p-3">
          <dt class="text-[11.5px] text-[#606863]">Required</dt>
          <dd class="mt-0.5 text-[18px] font-semibold text-[#121614]">{{ formatMB(required) }}</dd>
        </div>
        <div class="rounded-xl border border-[#e4e4de] p-3">
          <dt class="text-[11.5px] text-[#606863]">Available</dt>
          <dd class="mt-0.5 text-[18px] font-semibold text-[#121614]">{{ formatMB(freeMB) }}</dd>
        </div>
        <div class="rounded-xl border border-[#e4e4de] p-3">
          <dt class="text-[11.5px] text-[#606863]">Shortfall</dt>
          <dd class="mt-0.5 text-[18px] font-semibold text-[#b22c26]">{{ formatMB(required - freeMB) }}</dd>
        </div>
      </dl>

      <h3 v-if="largest.length" class="mt-5 text-[13px] font-semibold text-[#121614]">Taking up the most space</h3>
      <ul v-if="largest.length" class="mt-2 divide-y divide-[#e4e4de] rounded-xl border border-[#e4e4de]">
        <li v-for="row in largest" :key="row.a.id" class="flex items-center gap-3 px-3 py-2.5">
          <StoreAppIcon :icon="row.a.icon" :tone="row.a.tone" size="xs" />
          <span class="flex-1 truncate text-[13.5px] text-[#121614]">{{ row.a.name }}</span>
          <span class="text-[13px] font-semibold text-[#121614]">{{ formatMB(row.total) }}</span>
        </li>
      </ul>

      <h3 class="mt-5 text-[13px] font-semibold text-[#121614]">You could</h3>
      <ul class="mt-1.5 space-y-1 text-[13px] text-[#606863]">
        <li v-if="dataTotal > 0">• Delete saved data you no longer need — frees up to {{ formatMB(dataTotal) }}</li>
        <li>• Uninstall an app you no longer use — your purchases stay on your account</li>
      </ul>
      <p class="mt-4 text-[12px] text-[#8f9792]">Afronet never deletes your apps or data automatically.</p>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="secondary" @click="emit('close')">Cancel download</UiButton>
        <UiButton @click="goToStorage">Manage storage</UiButton>
      </div>
    </div>

    <!-- The numbers before downloading ------------------------------------>
    <div v-else-if="phase === 'precheck'">
      <div class="flex items-center gap-3">
        <StoreAppIcon :icon="app.icon" :tone="app.tone" size="md" />
        <div class="min-w-0">
          <p class="truncate text-[15px] font-semibold text-[#121614]">{{ app.name }}</p>
          <p class="text-[12.5px] text-[#606863]">
            {{ isUpdate ? `Update ${inst.version} → ${app.version}` : `Version ${app.version}` }} · {{ app.creatorName }}
          </p>
        </div>
      </div>

      <dl class="mt-4 divide-y divide-[#e4e4de] rounded-xl border border-[#e4e4de]">
        <div
          v-for="row in facts"
          :key="row.k"
          class="flex items-start justify-between gap-4 px-3.5 py-2.5 text-[13px]"
        >
          <dt class="text-[#606863]">{{ row.k }}</dt>
          <dd class="text-right font-medium text-[#121614]">{{ row.v }}</dd>
        </div>
      </dl>

      <p class="mt-3 text-[12.5px] leading-relaxed text-[#606863]">
        The app is downloaded into Afronet and runs inside it, in a sandbox of its own. Data you save in it can
        use more space over time.
      </p>
      <p v-if="isUpdate" class="mt-2 rounded-lg bg-[#eaf3ee] px-3 py-2 text-[12.5px] text-[#0b5d3e]">
        Your saved progress is kept. Version {{ inst.version }} keeps working until the update is verified.
      </p>

      <div class="mt-3 flex flex-wrap items-center justify-between gap-2">
        <StoreDemoTag label="Demo figures" />
        <span class="text-[11.5px] text-[#8f9792]">{{ storeCopy.storageEstimate }}</span>
      </div>

      <div v-if="!online" class="mt-4 flex items-start gap-2.5 rounded-xl bg-[#faf3e3] p-3 text-[13px] text-[#b07f15]">
        <i class="fa-solid fa-link-slash mt-0.5 text-[13px]" aria-hidden="true"></i>
        You’re offline. Downloads need a connection — apps you already downloaded still open.
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton>
        <UiButton :disabled="!online" @click="begin">
          {{ isUpdate ? 'Update' : 'Download' }} · {{ formatMB(app.downloadMB) }}
        </UiButton>
      </div>
    </div>

    <!-- Downloading, then verifying --------------------------------------->
    <div v-else-if="phase === 'progress'" class="py-1">
      <div class="flex items-center gap-3">
        <StoreAppIcon :icon="app.icon" :tone="app.tone" size="md" />
        <div>
          <p class="text-[15px] font-semibold text-[#121614]">{{ progressTitle }}</p>
          <p class="text-[12.5px] text-[#606863]">{{ progressDetail }}</p>
        </div>
      </div>

      <div class="mt-5">
        <UiProgress :value="task.progress" :tone="task.status === 'paused' ? 'gold' : 'brand'" />
      </div>

      <p v-if="task.status === 'verifying'" class="mt-3 flex items-center gap-1.5 text-[12.5px] text-[#606863]">
        <i class="fa-solid fa-shield-halved text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
        Files are only installed after they pass verification.
      </p>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <template v-if="task.status === 'verifying'">
          <UiButton variant="secondary" @click="emit('close')">Continue in background</UiButton>
        </template>
        <template v-else>
          <UiButton variant="ghost" @click="abandon">Cancel</UiButton>
          <UiButton v-if="task.status === 'paused'" variant="secondary" @click="resumeDownload(appId)">
            <template #icon><i class="fa-solid fa-play text-[11px]" aria-hidden="true"></i></template>
            Resume
          </UiButton>
          <UiButton v-else variant="secondary" @click="pauseDownload(appId)">
            <template #icon><i class="fa-solid fa-pause text-[11px]" aria-hidden="true"></i></template>
            Pause
          </UiButton>
          <UiButton @click="emit('close')">Hide</UiButton>
        </template>
      </div>
    </div>

    <!-- Interrupted or damaged -------------------------------------------->
    <div v-else-if="phase === 'failed'">
      <div class="py-1 text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#b22c26]/10 text-[#b22c26]">
          <i class="fa-solid fa-triangle-exclamation text-[20px]" aria-hidden="true"></i>
        </span>
        <p class="mt-3 text-[16px] font-semibold text-[#121614]">
          {{ integrity ? 'Package failed verification' : 'Download stopped' }}
        </p>
        <p class="mx-auto mt-1 max-w-xs text-[13px] leading-relaxed text-[#606863]">{{ task.error }}</p>
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="ghost" @click="abandonAndClose">Cancel download</UiButton>
        <UiButton :disabled="!online" @click="retry">
          <template #icon><i class="fa-solid fa-rotate-left text-[11px]" aria-hidden="true"></i></template>
          {{ integrity ? 'Download again' : online ? 'Retry' : 'Waiting for connection' }}
        </UiButton>
      </div>
    </div>

    <!-- Installed --------------------------------------------------------->
    <div v-else>
      <div class="py-2 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3ee] text-[#0b5d3e]">
          <i class="fa-solid fa-circle-check text-[26px]" aria-hidden="true"></i>
        </span>
        <p class="mt-3 text-[17px] font-semibold text-[#121614]">{{ app.name }} is ready</p>
        <p class="mt-1 text-[13px] text-[#606863]">
          Version {{ inst?.version }} · verified · uses {{ formatMB(app.installedMB) }}
        </p>
        <p class="mx-auto mt-3 max-w-xs text-[12.5px] text-[#606863]">
          It opens inside Afronet, not on your phone’s home screen. Remove it any time from My Apps.
        </p>
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="secondary" @click="emit('close')">Done</UiButton>
        <UiButton @click="openApp">Open app</UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
import { compareVersions, formatMB, storeCopy } from '~/data/store'

const props = defineProps({
  appId: { type: String, required: true },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const {
  online,
  getApp,
  freeMB,
  library,
  getInstalled,
  getDownload,
  requiredMB,
  startDownload,
  pauseDownload,
  resumeDownload,
  cancelDownload,
} = useAppLibrary()

const app = computed(() => getApp(props.appId))
const inst = computed(() => getInstalled(props.appId))
const task = computed(() => getDownload(props.appId))

// Whether this dialog is the one that started the current download. Without it, reopening
// the dialog on an already-installed app would show the success screen again.
const started = ref(false)
watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) started.value = Boolean(getDownload(props.appId))
  },
)

const isUpdate = computed(() => Boolean(inst.value && compareVersions(app.value.version, inst.value.version) > 0))

const required = computed(() =>
  isUpdate.value
    ? app.value.downloadMB + Math.max(0, app.value.installedMB - inst.value.appFilesMB)
    : requiredMB(app.value),
)

const phase = computed(() => {
  if (task.value) return task.value.status === 'failed' ? 'failed' : 'progress'
  if (started.value && inst.value && !isUpdate.value) return 'done'
  return freeMB.value < required.value ? 'blocked' : 'precheck'
})

const heading = computed(
  () =>
    ({
      blocked: 'Not enough storage',
      precheck: isUpdate.value ? 'Update app' : 'Before you download',
      progress: isUpdate.value ? 'Updating' : 'Downloading',
      failed: 'Download problem',
      done: 'Ready to open',
    })[phase.value],
)

const integrity = computed(() => String(task.value?.error || '').startsWith('Integrity'))

const progressTitle = computed(() => {
  if (task.value.status === 'verifying') return 'Verifying package…'
  if (task.value.status === 'paused') return 'Paused'
  return task.value.kind === 'update' ? 'Downloading update…' : 'Downloading…'
})

const progressDetail = computed(() => {
  if (task.value.status === 'verifying') return `Checking signature, checksum and version ${app.value.version}`
  const got = Math.round((task.value.progress / 100) * app.value.downloadMB * 10) / 10
  return `${got} of ${formatMB(app.value.downloadMB)}`
})

const facts = computed(() => [
  { k: 'Download size', v: formatMB(app.value.downloadMB) },
  {
    k: isUpdate.value ? 'Installed size after update' : 'Estimated installed size',
    v: formatMB(app.value.installedMB),
  },
  { k: 'Space needed while installing', v: `${formatMB(required.value)} · package + unpacked files` },
  { k: 'Available to Afronet', v: `${formatMB(freeMB.value)} estimated` },
  {
    k: 'Left after install',
    v: formatMB(freeMB.value - (isUpdate.value ? app.value.installedMB - inst.value.appFilesMB : app.value.installedMB)),
  },
  { k: 'External services', v: app.value.externalDeps.length ? app.value.externalDeps.join(', ') : 'None' },
  { k: 'Additional data', v: app.value.extraData || 'None expected' },
])

// What a person could remove to make room, biggest first.
const largest = computed(() =>
  [...library.value]
    .map(({ i, a }) => ({ a, total: i.appFilesMB + i.dataMB }))
    .sort((x, y) => y.total - x.total)
    .slice(0, 3),
)

const dataTotal = computed(() => library.value.reduce((sum, { i }) => sum + i.dataMB, 0))

const begin = () => {
  if (startDownload(props.appId, isUpdate.value ? 'update' : 'install')) started.value = true
}

const abandon = () => {
  cancelDownload(props.appId)
  started.value = false
}

const abandonAndClose = () => {
  abandon()
  emit('close')
}

const retry = () => {
  if (integrity.value || task.value.progress === 0) {
    const kind = task.value.kind
    cancelDownload(props.appId)
    startDownload(props.appId, kind)
    return
  }
  resumeDownload(props.appId)
}

const goToStorage = () => {
  emit('close')
  navigateTo(`/store/storage?return=${props.appId}`)
}

const openApp = () => {
  emit('close')
  navigateTo(`/run/${props.appId}`)
}
</script>
