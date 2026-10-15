<!-- app/pages/studio/apps/[id]/index.vue -->

<!--
  One app's home. For a published app it is the live listing: how it is doing, its version
  history, and the way to ship the next version. For one that has not been published yet it
  says what the next step is and sends them there, rather than showing an empty dashboard.

  Shipping an update changes the listing in place rather than replacing it, so ratings and
  install counts survive, and it writes a note into the changelog users read in My Apps —
  which is where this loop closes: ship here, and the update appears there.
-->
<template>
  <div v-if="app">
    <StudioAppSubnav :app="app">
      <template v-if="app.storeAppId" #actions>
        <UiButton variant="secondary" size="sm" :to="`/store/app/${app.storeAppId}`">Public listing</UiButton>
      </template>
    </StudioAppSubnav>

    <!-- Not published yet ------------------------------------------------->
    <div v-if="!app.storeAppId" class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-2">
      <UiStatePanel
        :title="nextStep.title"
        :body="nextStep.body"
      >
        <template #icon><i class="fa-solid fa-rocket text-[16px]" aria-hidden="true"></i></template>
        <template #action>
          <div class="flex flex-wrap justify-center gap-2">
            <UiButton variant="secondary" :to="`/studio/builder/${app.id}`">Edit in builder</UiButton>
            <UiButton :to="nextStep.to">{{ nextStep.action }}</UiButton>
          </div>
        </template>
      </UiStatePanel>
    </div>

    <!-- Live --------------------------------------------------------------->
    <div v-else>
      <div
        v-if="changes.length"
        class="mb-5 flex flex-wrap items-center gap-3 rounded-2xl bg-[#faf3e3] p-4 text-[#b07f15]"
      >
        <i class="fa-solid fa-rocket shrink-0 text-[14px]" aria-hidden="true"></i>
        <p class="min-w-[220px] flex-1 text-[13.5px]">
          <strong>{{ changes.join(', ') }} changed since you published.</strong>
          {{ app.testedAt ? `Ready to ship as ${nextVersion}.` : 'Run the tests before shipping.' }}
        </p>
        <UiButton v-if="app.testedAt" size="sm" @click="openShip">Ship update</UiButton>
        <UiButton v-else size="sm" :to="`/studio/apps/${app.id}/test`">Run tests</UiButton>
      </div>

      <section class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-[16px] font-semibold text-[#121614]">Live in the store</h2>
          <span class="text-[11.5px] text-[#8f9792]">Ratings are not collected yet</span>
        </div>

        <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div v-for="s in stats" :key="s.label">
            <dt class="text-[12px] text-[#606863]">{{ s.label }}</dt>
            <dd class="text-[20px] font-semibold text-[#121614]">{{ s.value }}</dd>
          </div>
        </dl>

        <div class="mt-5 flex flex-wrap items-center gap-2 border-t border-[#e4e4de] pt-4 text-[13px]">
          <span class="rounded-lg bg-[#f7f7f4] px-2.5 py-1 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[12px] text-[#121614]">
            {{ link }}
          </span>
          <UiButton size="sm" variant="ghost" @click="copyLink">Copy link</UiButton>
        </div>

        <div class="mt-4 flex flex-wrap gap-2">
          <UiButton variant="secondary" size="sm" :to="`/studio/builder/${app.id}`">Edit and prepare an update</UiButton>
          <UiButton variant="ghost" size="sm" @click="confirm = 'unpublish'">Unpublish</UiButton>
          <UiButton variant="ghost" size="sm" @click="confirm = 'archive'">Archive</UiButton>
        </div>
      </section>

      <section class="mt-4 rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6">
        <h2 class="text-[15px] font-semibold text-[#121614]">Update history</h2>
        <ol class="mt-3 space-y-3">
          <li v-for="(v, i) in app.versions" :key="`${v.version}-${i}`" class="flex items-start gap-3">
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="i === 0 ? 'bg-[#0b5d3e]' : 'bg-[#e4e4de]'" />
            <div>
              <p class="text-[13.5px] font-medium text-[#121614]">
                {{ v.version }}
                <span v-if="i === 0" class="text-[11.5px] font-normal text-[#0b5d3e]">live</span>
              </p>
              <p class="text-[12.5px] text-[#606863]">{{ v.note }} · {{ formatDate(v.date) }}</p>
            </div>
          </li>
        </ol>
      </section>
    </div>

    <!-- Shipping ----------------------------------------------------------->
    <UiModal
      :open="ship"
      :title="shipPhase === 'done' ? `${shippedVersion} is live` : `Ship ${app.name} ${nextVersion}`"
      @close="closeShip"
    >
      <div v-if="shipPhase === 'form'" class="space-y-4">
        <UiField label="Release notes" hint="Shown to users in My Apps before they update.">
          <UiTextarea v-model="notes" :rows="3" placeholder="e.g. Added 50 more practice questions." />
        </UiField>

        <div class="divide-y divide-[#e4e4de] border-y border-[#e4e4de]">
          <UiRow label="Mark as required" hint="Only for a security fix. Otherwise people update when they choose.">
            <template #value><UiToggle v-model="mandatory" label="Mark as required" /></template>
          </UiRow>
        </div>

        <p class="rounded-xl bg-[#f7f7f4] p-3 text-[12.5px] leading-relaxed text-[#606863]">
          People see the update the next time they open the store. Their saved data is kept.
        </p>

        <div class="flex flex-wrap justify-end gap-2">
          <UiButton variant="secondary" @click="closeShip">Cancel</UiButton>
          <UiButton @click="doShip">Submit update</UiButton>
        </div>
      </div>

      <div v-else-if="shipPhase === 'working'" class="flex items-center gap-3 py-6">
        <UiSpinner />
        <p class="text-[14px] font-medium text-[#121614]">Validating the package and fast-tracking review…</p>
      </div>

      <div v-else class="py-2 text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3ee] text-[#0b5d3e]">
          <i class="fa-solid fa-circle-check text-[26px]" aria-hidden="true"></i>
        </span>
        <p class="mt-3 text-[17px] font-semibold text-[#121614]">{{ shippedVersion }} is live</p>
        <p class="mt-1 text-[13px] text-[#606863]">
          Anyone with {{ app.name }} installed will see an update waiting in My Apps.
        </p>
        <div class="mt-5 flex flex-wrap justify-center gap-2">
          <UiButton variant="secondary" @click="closeShip">Done</UiButton>
          <UiButton to="/store/my-apps?tab=updates">See it as a user</UiButton>
        </div>
      </div>
    </UiModal>

    <StoreConfirmDialog
      :open="Boolean(confirm)"
      :title="confirm === 'unpublish' ? `Unpublish ${app.name}?` : `Archive ${app.name}?`"
      :confirm-label="confirm === 'unpublish' ? 'Unpublish' : 'Archive'"
      @close="confirm = ''"
      @confirm="runConfirm"
    >
      <p>
        New users won’t find it in the store. Anyone who already installed or bought it keeps access, and their
        purchase stays restorable.
      </p>
    </StoreConfirmDialog>
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="App not found" body="It may have been deleted.">
      <template #action><UiButton to="/studio/apps">My Apps</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { compact, formatDate, storeCopy } from '~/data/store'
import { bumpVersion } from '~/data/studio'

definePageMeta({ layout: 'studio' })

const route = useRoute()

const { findDevApp, shipUpdate, withdraw, unpublishedChanges, notify } = useStudio()
const { getApp } = useAppLibrary()

const app = computed(() => findDevApp(String(route.params.id || '')))

useHead({ title: computed(() => `${app.value?.name ?? 'App'} · Afronet Studio`) })

const ship = ref(false)
const shipPhase = ref('form')
const shippedVersion = ref('')
const notes = ref('')
const mandatory = ref(false)
const confirm = ref('')

const listing = computed(() => (app.value.storeAppId ? getApp(app.value.storeAppId) : null))
const nextVersion = computed(() => bumpVersion(app.value.version))

// What is on this build but not yet on the listing — read by comparing the two.
const changes = computed(() => unpublishedChanges(app.value))
// The address the listing is really at, so the link works where Afronet is running.
const origin = ref('')
onMounted(() => { origin.value = window.location.origin })
const link = computed(() => `${origin.value}/store/app/${app.value.storeAppId}`)

// All read from the listing, which is what a device reports against. The build keeps its own
// copies of these and they are never written to, so reading them showed nothing while the
// store page for the same app showed the real count.
const stats = computed(() => [
  { label: 'Current version', value: app.value.version },
  {
    label: 'Installs',
    value: listing.value ? compact(listing.value.installs ?? 0) : '—',
  },
  {
    label: 'Rating',
    value: listing.value?.ratingCount ? `${listing.value.rating.toFixed(1)} ★` : 'New',
  },
])

/** The one thing to do next for an app that is not live yet. */
const nextStep = computed(() => {
  const a = app.value
  if (a.status === 'in_review' || a.status === 'rejected') {
    return {
      title: a.status === 'rejected' ? 'A reviewer asked for changes' : 'Waiting for a reviewer',
      body:
        a.status === 'rejected'
          ? 'Read the comments on the publish screen, resolve them, and resubmit.'
          : 'Your app is in the review queue. The publish screen shows where it has got to.',
      to: `/studio/apps/${a.id}/publish`,
      action: 'Go to publishing',
    }
  }
  if (!a.testedAt) {
    return {
      title: 'Not tested since the last change',
      body: 'Run the tests, and this app can go to the publishing checklist.',
      to: `/studio/apps/${a.id}/test`,
      action: 'Run tests',
    }
  }
  return {
    title: 'Not published yet',
    body: 'The checklist shows what is left before this app can be submitted for review.',
    to: `/studio/apps/${a.id}/publish`,
    action: 'Go to publishing',
  }
})

const openShip = () => {
  notes.value = ''
  mandatory.value = false
  shipPhase.value = 'form'
  ship.value = true
}

const closeShip = () => {
  if (shipPhase.value === 'working') return
  ship.value = false
}

// A pause before it lands, because shipping runs a validation and a fast-track review.
let timer = null

const doShip = () => {
  shipPhase.value = 'working'
  if (!import.meta.client) return
  timer = setTimeout(async () => {
    const version = await shipUpdate(app.value.id, notes.value, mandatory.value)
    if (!version) {
      shipPhase.value = 'form'
      return
    }
    shippedVersion.value = version
    shipPhase.value = 'done'
  }, 1400)
}

const copyLink = async () => {
  if (!import.meta.client) return
  try {
    await navigator.clipboard.writeText(link.value)
    notify('Link copied', 'success')
  } catch {
    // Copying needs a secure context, which a phone on a local network may not have.
    notify(link.value)
  }
}

const runConfirm = () => withdraw(app.value.id, confirm.value)

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
