<!-- app/pages/studio/builder/[id].vue -->

<!--
  Where a developer actually spends their time: describe a change, see it, keep it or throw
  it away. Three panels on a wide screen — chat, the running app, the settings — and one at
  a time on a phone.

  The preview is the real runtime, not a picture of it, so approving something here means
  approving what a user will get.

  Undo and redo work against the build config rather than the chat, so a change made by
  hand on the right can be undone as easily as one the assistant proposed.
-->
<template>
  <div v-if="app">
    <StudioAppSubnav :app="app">
      <template #actions>
        <UiIconButton label="Undo" :tone="canUndo(app.id) ? 'default' : 'default'" @click="undo(app.id)">
          <i class="fa-solid fa-rotate-left text-[12px]" :class="canUndo(app.id) ? '' : 'opacity-30'" aria-hidden="true"></i>
        </UiIconButton>
        <UiIconButton label="Redo" @click="redo(app.id)">
          <i class="fa-solid fa-rotate-right text-[12px]" :class="canRedo(app.id) ? '' : 'opacity-30'" aria-hidden="true"></i>
        </UiIconButton>
        <UiButton size="sm" :to="`/studio/apps/${app.id}`">
          <template #icon><i class="fa-solid fa-flask text-[11px]" aria-hidden="true"></i></template>
          Run tests
        </UiButton>
      </template>
    </StudioAppSubnav>

    <div class="mb-3 lg:hidden">
      <UiSegmentedControl v-model="panel" :options="panels" size="sm" />
    </div>

    <div class="grid gap-4 lg:grid-cols-[320px_1fr_290px]">
      <div :class="panel === 'chat' ? '' : 'hidden lg:block'">
        <StudioBuilderChat
          :messages="messages"
          :suggestions="suggestions"
          :credits-left="creditsLeft"
          @send="send"
          @apply="apply"
          @discard="discard"
        />
      </div>

      <div :class="panel === 'preview' ? '' : 'hidden lg:block'">
        <StudioPreviewPane :app="app" />
      </div>

      <div :class="panel === 'settings' ? '' : 'hidden lg:block'">
        <StudioBuilderSettings
          :app="app"
          @config="setConfig(app.id, $event)"
          @rename="updateDevApp(app.id, { name: $event })"
          @retagline="updateDevApp(app.id, { tagline: $event })"
          @reicon="updateDevApp(app.id, { icon: $event })"
          @history="history = true"
        />
      </div>
    </div>

    <UiModal :open="history" title="Version history" @close="history = false">
      <ol class="space-y-3">
        <li v-for="(v, i) in app.versions" :key="`${v.version}-${i}`" class="flex items-start gap-3">
          <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="i === 0 ? 'bg-[#0b5d3e]' : 'bg-[#e4e4de]'" />
          <div class="flex-1">
            <p class="text-[13.5px] font-medium text-[#121614]">
              {{ v.version }}
              <span v-if="i === 0" class="text-[11.5px] font-normal text-[#606863]">current</span>
            </p>
            <p class="text-[12.5px] text-[#606863]">{{ v.note }} · {{ formatDate(v.date) }}</p>
          </div>
        </li>
      </ol>
    </UiModal>
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="Project not found" body="It may have been archived or deleted.">
      <template #action><UiButton to="/studio/apps">My Apps</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { formatDate, uid } from '~/data/store'
import { changesComingSoon } from '~/data/studio'

definePageMeta({ layout: 'studio' })

const route = useRoute()

const { findDevApp, updateDevApp, setConfig, canUndo, canRedo, undo, redo, creditsLeft, notify } = useStudio()

// The preview is a real running app, so what it saves has to come back the way it does
// everywhere else. Without this, trying the save in a preview worked until the page was
// reloaded — which is the first thing a developer does to check it.
const { hydrateAppData } = useAppLibrary()
onMounted(hydrateAppData)

const appId = computed(() => String(route.params.id || ''))
const app = computed(() => findDevApp(appId.value))

useHead({ title: computed(() => `${app.value?.name ?? 'Builder'} · Afronet Studio`) })

const panels = [
  { value: 'chat', label: 'Chat' },
  { value: 'preview', label: 'Preview' },
  { value: 'settings', label: 'Settings' },
]

const panel = ref('preview')
const history = ref(false)

// No suggestion chips: every one of them was a change the old rule-based chat could make, and
// offering a change that cannot be made is worse than offering none.
const suggestions = []

// The conversation lives with the page: it is a record of this editing session, not part of
// the app, and starting again from the app list should start a fresh one.
const messages = ref([
  {
    id: 'm0',
    role: 'ai',
    text: app.value
      ? `I wrote “${app.value.name}” from your description: ${app.value.config.prompt || app.value.description}. Try it in the Preview tab, and use Settings to change how it looks.`
      : '',
  },
])

const send = (text) => {
  const trimmed = String(text || '').trim()
  if (!trimmed || !app.value) return

  // Changing an app by describing the change means generating it again, which costs a
  // generation and is not wired up. Saying so plainly beats charging for an apology.
  messages.value = [
    ...messages.value,
    { id: uid('m'), role: 'user', text: trimmed },
    { id: uid('m'), role: 'ai', text: changesComingSoon, status: 'unsupported' },
  ]
}

const setStatus = (id, status) => {
  messages.value = messages.value.map((m) => (m.id === id ? { ...m, status } : m))
}

// A short "Building…" before the change lands, because applying a proposal rebuilds the
// app — showing it as instant would teach the wrong thing about what Apply costs.
let applyTimer = null

const apply = (id) => {
  const message = messages.value.find((m) => m.id === id)
  if (!message?.proposal || !app.value) return
  setStatus(id, 'applying')
  if (applyTimer) clearTimeout(applyTimer)
  applyTimer = setTimeout(() => {
    setConfig(appId.value, message.proposal.patch)
    setStatus(id, 'applied')
  }, 900)
}

const discard = (id) => setStatus(id, 'discarded')

onBeforeUnmount(() => {
  if (applyTimer) clearTimeout(applyTimer)
})
</script>
