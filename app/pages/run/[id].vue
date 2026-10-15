<!-- app/pages/run/[id].vue -->

<!--
  A downloaded app, open inside Afronet. This is the route the whole release exists for:
  nothing is installed on the phone, nothing leaves the shell, and the app on screen is a
  guest inside a frame Afronet controls.

  The order of the checks below is the order the runtime has to keep: is the package on this
  device, is this person entitled to it, can we reach the server, has the app been granted what
  it needs — and only then fetch the package, verify it, and run it. Each failed check is a
  full-frame message with the buttons that resolve it, never an error on top of a half-started
  app.

  Verification is real now. The checksum in the manifest is recomputed from the files that
  arrived; a package that does not match is not run, and says why.
-->
<template>
  <div class="flex h-[100dvh] w-full flex-col bg-[#121614] font-[Inter,ui-sans-serif,system-ui,sans-serif] antialiased">
    <header class="flex h-14 shrink-0 items-center gap-3 px-3 text-[#ffffff] sm:px-5">
      <button
        class="rounded-lg p-2 text-[#ffffff] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#ffffff]/10"
        aria-label="Back to My Apps"
        @click="navigateTo('/store/my-apps')"
      >
        <i class="fa-solid fa-arrow-left text-[15px]" aria-hidden="true"></i>
      </button>

      <StoreAppIcon v-if="app" :icon="app.icon" :tone="app.tone" size="xs" />

      <div class="min-w-0 flex-1">
        <p class="truncate text-[14px] font-semibold">{{ app?.name ?? 'App' }}</p>
        <p v-if="app" class="truncate text-[11.5px] text-[#ffffff]/50">
          by {{ app.creatorName }} · runs in Afronet sandbox
        </p>
      </div>

      <span
        v-if="loaded?.state === 'unverifiable'"
        class="hidden items-center gap-1.5 text-[11.5px] text-[#faf3e3] sm:inline-flex"
        title="Verification needs a secure connection (https or localhost)"
      >
        <i class="fa-solid fa-shield-halved text-[10px]" aria-hidden="true"></i>
        Not verified here
      </span>

      <span v-if="!online" class="hidden items-center gap-1.5 text-[11.5px] text-[#faf3e3] sm:inline-flex">
        <i class="fa-solid fa-link-slash text-[10px]" aria-hidden="true"></i>
        No connection
      </span>

      <button
        v-if="app && inst"
        class="rounded-lg p-2 text-[#ffffff] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#ffffff]/10"
        aria-label="App settings"
        @click="settings = true"
      >
        <i class="fa-solid fa-sliders text-[15px]" aria-hidden="true"></i>
      </button>
    </header>

    <RuntimeFrame>
      <!-- The package isn't on this device ---------------------------------->
      <RuntimeMessage
        v-if="state === 'missing'"
        icon="fa-cube"
        :title="runtimeCopy.notInstalled.title"
        :body="runtimeCopy.notInstalled.body"
      >
        <template #actions>
          <UiButton variant="secondary" to="/store/my-apps">My Apps</UiButton>
          <UiButton v-if="app" :to="`/store/app/${app.id}`">Download again</UiButton>
          <UiButton v-else to="/store">Back to store</UiButton>
        </template>
      </RuntimeMessage>

      <!-- Paid for, but the server hasn't confirmed it ---------------------->
      <RuntimeMessage
        v-else-if="state === 'unverified'"
        icon="fa-lock"
        tone="danger"
        :title="runtimeCopy.unverified.title"
        :body="runtimeCopy.unverified.body"
      >
        <template #actions>
          <UiButton variant="secondary" to="/store/my-apps">My Apps</UiButton>
          <UiButton @click="restart">Check again</UiButton>
        </template>
      </RuntimeMessage>

      <!-- No connection ----------------------------------------------------->
      <RuntimeMessage
        v-else-if="state === 'offline'"
        icon="fa-link-slash"
        :title="runtimeCopy.noConnection.title"
        :body="runtimeCopy.noConnection.body"
      >
        <template #actions>
          <UiButton variant="secondary" to="/store/my-apps">My Apps</UiButton>
          <UiButton @click="restart">Try again</UiButton>
        </template>
      </RuntimeMessage>

      <!-- A permission to answer -------------------------------------------->
      <RuntimeMessage
        v-else-if="state === 'permission'"
        icon="fa-microphone"
        :title="`Allow ${app.name} to use the microphone?`"
        body="Used only while you press Record. Afronet passes the audio to this app alone — never to another app, and never to us."
      >
        <template #actions>
          <UiButton variant="secondary" @click="answerMic('denied')">Don’t allow</UiButton>
          <UiButton @click="answerMic('granted')">Allow</UiButton>
        </template>
      </RuntimeMessage>

      <!-- Refused, and told what that costs --------------------------------->
      <RuntimeMessage
        v-else-if="state === 'denied'"
        icon="fa-microphone-slash"
        title="Recording is turned off"
        body="Without the microphone this app can’t record. Everything else still works, and you can change this in its settings."
      >
        <template #actions>
          <UiButton variant="secondary" @click="answerMic('granted')">Allow microphone</UiButton>
          <UiButton @click="acknowledged = true">Continue without it</UiButton>
        </template>
      </RuntimeMessage>

      <!-- Fetching and checking the package ---------------------------------->
      <div v-else-if="state === 'loading'" class="flex flex-1 flex-col items-center justify-center gap-3">
        <StoreAppIcon :icon="app.icon" :tone="app.tone" size="lg" />
        <p class="flex items-center gap-1.5 text-[12.5px] text-[#606863]">
          <i class="fa-solid fa-shield-halved text-[11px] text-[#0b5d3e]" aria-hidden="true"></i>
          {{ runtimeCopy.verifying }} v{{ inst.version }}…
        </p>
      </div>

      <!-- The package is not the one that was approved ----------------------->
      <RuntimeMessage
        v-else-if="state === 'mismatch'"
        icon="fa-triangle-exclamation"
        tone="danger"
        title="This app failed verification"
        body="The files on this device don’t match the package Afronet approved, so it has not been started. Downloading it again replaces them."
      >
        <template #actions>
          <UiButton variant="secondary" to="/store/my-apps">My Apps</UiButton>
          <UiButton @click="reload">Download again</UiButton>
        </template>
      </RuntimeMessage>

      <!-- It could not be fetched -------------------------------------------->
      <RuntimeMessage
        v-else-if="state === 'error'"
        icon="fa-triangle-exclamation"
        tone="danger"
        title="This app could not be opened"
        :body="loaded?.error ?? 'Something went wrong fetching it.'"
      >
        <template #actions>
          <UiButton variant="secondary" to="/store/my-apps">My Apps</UiButton>
          <UiButton @click="reload">Try again</UiButton>
        </template>
      </RuntimeMessage>

      <!-- Running ------------------------------------------------------------>
      <RuntimeSandbox
        v-else
        :pkg="loaded.pkg"
        :app-id="app.id"
        :title="app.name"
        :run-key="runKey"
        @ready="onAppReady"
      />
    </RuntimeFrame>

    <RuntimeSettingsDrawer
      v-if="app && inst"
      :open="settings"
      :app="app"
      :inst="inst"
      :manifest="loaded?.pkg?.manifest ?? null"
      :mic-granted="micState === 'granted'"
      @close="settings = false"
      @restart="restartFromSettings"
      @clear-data="clearAppData"
      @permission="onPermission"
    />
  </div>
</template>

<script setup>
import { runtimeCopy } from '~/data/runtime'

definePageMeta({ layout: 'blank' })

const route = useRoute()

const {
  online,
  getApp,
  getInstalled,
  hasEntitlement,
  permissionState,
  setPermission,
  logUsage,
  clearData,
  notify,
  loadCatalogue,
  hydrateAppData,
  hydrateInstalled,
} = useAppLibrary()
const { load, forget } = useAppPackage()

// This page runs outside the store's layout, so nothing above it has fetched the catalogue.
// Without this, opening an app directly — or reloading one — finds nothing and reports a
// perfectly good app as not installed.
await loadCatalogue()

const appId = computed(() => String(route.params.id || ''))
const app = computed(() => getApp(appId.value))
const inst = computed(() => getInstalled(appId.value))

useHead({ title: computed(() => `${app.value?.name ?? 'App'} · Afronet`) })

const settings = ref(false)
const acknowledged = ref(false)
const runKey = ref(0)

/** null while nothing has been asked for, then { pkg, state } or { error }. */
const loaded = ref(null)
const loading = ref(false)

const needsMic = computed(() => Boolean(app.value?.permissions.some((p) => p.id === 'microphone')))
const micState = computed(() => permissionState(appId.value, 'microphone'))

const packageUrl = computed(() => `/api/packages/${appId.value}`)

const state = computed(() => {
  if (!app.value || !inst.value) return 'missing'
  if (!hasEntitlement(app.value.id)) return 'unverified'
  if (!online.value) return 'offline'
  if (needsMic.value && micState.value === 'ask') return 'permission'
  if (needsMic.value && micState.value === 'denied' && !acknowledged.value) return 'denied'
  if (loading.value || !loaded.value) return 'loading'
  if (loaded.value.error) return 'error'
  if (loaded.value.state === 'mismatch') return 'mismatch'
  return 'running'
})

/**
 * Fetches and verifies the package. Client-only: on the server the frame renders at the
 * verifying step, which is also what the browser shows first.
 */
const fetchPackage = async ({ force = false } = {}) => {
  if (!import.meta.client || !app.value || !inst.value) return
  loading.value = true
  loaded.value = await load(packageUrl.value, { force })
  loading.value = false
}

onMounted(async () => {
  // What this app saved on a previous visit, before it asks for it.
  hydrateAppData()
  // And what this device has installed. This page runs outside the store's layout, so nothing
  // above it has read that back — without it, reloading a running app reports it as missing.
  await hydrateInstalled()
  fetchPackage()
})

// Moving between apps without leaving the route.
watch(appId, () => {
  loaded.value = null
  acknowledged.value = false
  fetchPackage()
})

const onAppReady = () => {
  if (inst.value) logUsage(appId.value)
}

const restart = () => {
  runKey.value += 1
  if (!loaded.value || loaded.value.error) fetchPackage()
}

const reload = () => {
  forget(packageUrl.value)
  runKey.value += 1
  fetchPackage({ force: true })
}

const restartFromSettings = () => {
  settings.value = false
  restart()
}

const answerMic = (answer) => {
  setPermission(appId.value, 'microphone', answer)
  acknowledged.value = false
  if (answer === 'granted') restart()
}

const onPermission = (permissionId, answer) => {
  setPermission(appId.value, permissionId, answer)
  if (permissionId === 'microphone') acknowledged.value = true
  notify(answer === 'granted' ? 'Microphone allowed for this app.' : 'Microphone revoked for this app.')
}

const clearAppData = () => {
  clearData(appId.value)
  settings.value = false
  notify(`${app.value.name}’s data cleared.`, 'success')
  restart()
}
</script>
