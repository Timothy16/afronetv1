<!-- app/components/Apps/Files.vue -->

<!-- Files & Drive. Rendered by /files, and inside a workspace window with `embedded`. -->
<template>
  <div :class="embedded ? 'p-5' : 'mx-auto w-full max-w-6xl px-5 py-8'">
    <UiPageHeader
      v-if="!embedded"
      eyebrow="Storage layer"
      title="Files & Drive"
      description="Every file lives on your device first. Sharing happens over the mesh; the cloud is only a mirror."
    >
      <template #actions>
        <UiButton variant="secondary" size="sm">
          <template #icon><i class="fa-solid fa-upload text-[12px]" aria-hidden="true"></i></template>
          Add files
        </UiButton>
        <UiButton size="sm" @click="startSync">
          <template #icon>
            <i class="fa-solid fa-arrows-rotate text-[12px]" :class="syncing ? 'animate-spin' : ''" aria-hidden="true"></i>
          </template>
          Sync
        </UiButton>
      </template>
    </UiPageHeader>

    <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard class="p-4 sm:col-span-2">
        <div class="flex items-baseline justify-between">
          <p class="text-[13px] font-medium text-[#121614]">Device storage</p>
          <p class="text-[12px] text-[#606863]">{{ storage.device.used }} of {{ storage.device.total }} GB used</p>
        </div>
        <UiProgress :value="(storage.device.used / storage.device.total) * 100" class="mt-3" />
        <div class="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
          <!-- The design gives every legend dot the brand colour, whatever the category. -->
          <span v-for="b in storage.breakdown" :key="b.label" class="text-[11px] text-[#606863]">
            <span class="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#0b5d3e] align-middle opacity-80" />
            {{ b.label }} · {{ b.value }} GB
          </span>
        </div>
      </UiCard>
      <UiCard class="p-4">
        <p class="text-[13px] font-medium text-[#121614]">Afronet storage</p>
        <p class="mt-1 text-[12px] text-[#606863]">{{ storage.afronet.used }} of {{ storage.afronet.total }} GB</p>
        <UiProgress :value="(storage.afronet.used / storage.afronet.total) * 100" tone="gold" class="mt-3" />
        <p class="mt-3 text-[11px] text-[#8f9792]">Mirrored at Polytechnic Node</p>
      </UiCard>
      <UiCard class="p-4">
        <p class="text-[13px] font-medium text-[#121614]">Transfers</p>
        <div class="mt-3 space-y-3">
          <div v-for="t in transfers" :key="t.id">
            <p class="flex justify-between text-[11px] text-[#606863]">
              <span class="truncate">{{ t.name }}</span>
              <span class="ml-2 shrink-0">{{ t.pct }}%</span>
            </p>
            <UiProgress :value="t.pct" class="mt-1.5" />
          </div>
        </div>
      </UiCard>
    </div>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <UiSectionHeading title="Recent" />
      <UiSegmentedControl
        v-model="filter"
        size="sm"
        :options="[
          { value: 'all', label: 'All' },
          { value: 'device', label: 'Offline files' },
          { value: 'afronet', label: 'Synced' },
          { value: 'queued', label: 'Queued' },
        ]"
      />
    </div>

    <div v-if="files.length === 0" class="mt-4">
      <UiStatePanel
        kind="empty"
        title="Nothing here yet"
        body="Files you create or receive over Afronet will appear in this view."
      >
        <template #action>
          <UiButton size="sm">Add files</UiButton>
        </template>
      </UiStatePanel>
    </div>
    <div v-else class="mt-4 overflow-hidden rounded-2xl border border-[#e4e4de]">
      <div
        v-for="(f, i) in files"
        :key="f.id"
        class="group flex items-center gap-4 px-4 py-3 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
        :class="i > 0 ? 'border-t border-[#e4e4de]' : ''"
      >
        <i class="fa-solid w-4 shrink-0 text-center text-[14px] text-[#606863]" :class="kindIcon[f.kind]" aria-hidden="true"></i>
        <div class="min-w-0 flex-1">
          <p class="truncate text-[13px] text-[#121614]">{{ f.name }}</p>
          <p class="mt-0.5 text-[11px] text-[#8f9792]">
            {{ f.size }} · {{ f.updated }}{{ f.sharedWith ? ` · with ${f.sharedWith.join(', ')}` : '' }}
          </p>
        </div>
        <UiBadge :tone="syncCopy[f.sync].tone">
          <i v-if="f.sync === 'queued'" class="fa-solid fa-cloud-arrow-up text-[10px]" aria-hidden="true"></i>
          {{ syncCopy[f.sync].label }}
        </UiBadge>
        <button
          :aria-label="`Share ${f.name}`"
          class="rounded-lg p-2 text-[#8f9792] opacity-0 transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614] group-hover:opacity-100"
          @click="openShare(f)"
        >
          <i class="fa-solid fa-share-nodes text-[14px]" aria-hidden="true"></i>
        </button>
      </div>
    </div>

    <UiModal
      :open="!!shareFile"
      :title="sent ? 'Sending over Afronet' : 'Share locally'"
      :description="shareFile?.name ?? ''"
      @close="shareFile = null"
    >
      <div v-if="sent" class="py-4">
        <UiStatePanel
          kind="success"
          title="Transfer started"
          body="The file is moving device to device. No internet, no upload, no copy in the cloud."
        >
          <template #action>
            <UiButton size="sm" @click="shareFile = null">Done</UiButton>
          </template>
        </UiStatePanel>
      </div>
      <template v-else>
        <p class="mb-3 flex items-center gap-2 text-[12px] text-[#606863]">
          <i class="fa-solid fa-users text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
          People reachable right now
        </p>
        <div class="space-y-1">
          <button
            v-for="c in reachable"
            :key="c.id"
            class="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            @click="sent = true"
          >
            <UiAvatar :src="c.avatar" :name="c.name" :size="34" :presence="c.presence" />
            <span class="min-w-0 flex-1">
              <span class="block truncate text-[13px] text-[#121614]">{{ c.name }}</span>
              <span class="block text-[11px] text-[#8f9792]">
                {{ c.username }} · {{ c.hops ? `${c.hops} hop away` : 'via gateway' }}
              </span>
            </span>
          </button>
        </div>
      </template>
    </UiModal>
  </div>
</template>

<script setup>
import { driveFiles, storage, transfers } from '~/data/files'
import { contacts } from '~/data/people'

defineProps({
  embedded: { type: Boolean, default: false },
})

const { startSync, syncing } = useAfronet()

// all | device | afronet | queued
const filter = ref('all')
const shareFile = ref(null)
const sent = ref(false)

const kindIcon = {
  folder: 'fa-folder',
  doc: 'fa-file-lines',
  pdf: 'fa-file',
  image: 'fa-image',
  video: 'fa-film',
  audio: 'fa-file-audio',
}

const syncCopy = {
  synced: { label: 'Synced', tone: 'brand' },
  offline: { label: 'On device', tone: 'muted' },
  queued: { label: 'Waiting for a gateway', tone: 'gold' },
  shared: { label: 'Shared locally', tone: 'brand' },
}

const files = computed(() =>
  driveFiles.filter((f) =>
    filter.value === 'all'
      ? true
      : filter.value === 'queued'
        ? f.sync === 'queued'
        : filter.value === 'afronet'
          ? f.sync === 'shared' || f.sync === 'synced'
          : f.sync === 'offline',
  ),
)

const reachable = contacts.filter((c) => c.presence !== 'offline')

const openShare = (f) => {
  shareFile.value = f
  sent.value = false
}
</script>
