<!-- app/components/Studio/BuilderSettings.vue -->

<!--
  The side of the builder a developer can use without spending a generation: the screens
  the build has, its name, icon and theme, and the facts review will care about.

  Everything here writes through the same path the chat's Apply uses, so a change made by
  hand invalidates the test result exactly as a generated one does. An app that was tested,
  then edited, is an untested app.
-->
<template>
  <div class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-4">
    <UiSegmentedControl v-model="tab" :options="tabs" size="sm" />

    <!-- Files ---------------------------------------------------------------->
    <ul v-if="tab === 'files'" class="mt-4 space-y-1.5">
      <li
        v-for="(s, i) in screens"
        :key="s.name"
        class="flex items-center gap-2 rounded-lg bg-[#f7f7f4] px-3 py-2 text-[13px] font-medium text-[#121614]"
      >
        <span class="text-[11px] text-[#8f9792]">{{ i + 1 }}</span>
        {{ s.name }}
      </li>
      <li v-if="!screens.length" class="rounded-lg bg-[#f7f7f4] px-3 py-2 text-[12.5px] text-[#606863]">
        Nothing generated yet.
      </li>
      <li class="pt-2 text-[12px] text-[#606863]">
        {{ app.config.saveProgress ? 'What people do here is kept while the app is open' : 'Nothing is kept between visits' }}
      </li>
    </ul>

    <!-- Design ------------------------------------------------------------->
    <div v-else-if="tab === 'design'" class="mt-4 space-y-4">
      <UiField label="App title">
        <UiInput :model-value="app.name" size="sm" @update:model-value="emit('rename', $event)" />
      </UiField>

      <UiField label="Short description">
        <UiInput :model-value="app.tagline" size="sm" @update:model-value="emit('retagline', $event)" />
      </UiField>

      <div>
        <p class="mb-1.5 text-[12.5px] font-medium text-[#121614]">Icon</p>
        <div class="grid grid-cols-6 gap-1.5">
          <button
            v-for="icon in appIcons"
            :key="icon"
            :aria-label="icon.replace('fa-', '').replace(/-/g, ' ')"
            :aria-pressed="app.icon === icon ? 'true' : 'false'"
            class="flex h-9 items-center justify-center rounded-lg transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            :class="app.icon === icon ? 'bg-[#121614] text-[#ffffff]' : 'bg-[#f7f7f4] text-[#606863] hover:text-[#121614]'"
            @click="emit('reicon', icon)"
          >
            <i class="fa-solid text-[13px]" :class="icon" aria-hidden="true"></i>
          </button>
        </div>
      </div>

      <div>
        <p class="mb-1.5 text-[12.5px] font-medium text-[#121614]">Theme colour</p>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="t in themeTones"
            :key="t.id"
            :aria-label="t.label"
            :aria-pressed="app.config.tone === t.id ? 'true' : 'false'"
            class="h-8 w-8 rounded-full border-2"
            :class="[swatches[t.id], app.config.tone === t.id ? 'border-[#121614]' : 'border-transparent']"
            @click="emit('config', { tone: t.id })"
          />
        </div>
      </div>

      <div class="divide-y divide-[#e4e4de] border-y border-[#e4e4de]">
        <UiRow label="Larger text">
          <template #value>
            <UiToggle
              :model-value="app.config.fontScale === 'large'"
              label="Larger text"
              @update:model-value="emit('config', { fontScale: $event ? 'large' : 'normal' })"
            />
          </template>
        </UiRow>
        <UiRow label="High contrast">
          <template #value>
            <UiToggle
              :model-value="app.config.highContrast"
              label="High contrast"
              @update:model-value="emit('config', { highContrast: $event })"
            />
          </template>
        </UiRow>
        <UiRow label="Save progress on device">
          <template #value>
            <UiToggle
              :model-value="app.config.saveProgress"
              label="Save progress on device"
              @update:model-value="emit('config', { saveProgress: $event })"
            />
          </template>
        </UiRow>
      </div>
    </div>

    <!-- What review will look at -------------------------------------------->
    <div v-else class="mt-4 space-y-4 text-[13px]">
      <div class="rounded-2xl bg-[#f7f7f4] p-3">
        <p class="text-[12px] font-medium text-[#606863]">Needs a connection for</p>
        <ul v-if="needs.length" class="mt-1.5 space-y-1">
          <li v-for="n in needs" :key="n" class="flex items-start gap-1.5 text-[#121614]">
            <i class="fa-solid fa-wifi mt-1 shrink-0 text-[10px] text-[#b07f15]" aria-hidden="true"></i>
            {{ n }}
          </li>
        </ul>
        <p v-else class="mt-1 text-[#121614]">Nothing — this build makes no network calls of its own.</p>
        <p class="mt-2 text-[12px] text-[#606863]">
          Read from the build, not from what the listing claims. It decides which permissions users see.
        </p>
      </div>

      <div>
        <p class="text-[12px] font-medium text-[#606863]">Build status</p>
        <p class="mt-1 flex items-center gap-1.5 font-medium text-[#121614]">
          <template v-if="app.testedAt">
            <i class="fa-solid fa-circle-check text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
            Built and tested {{ formatDate(app.testedAt) }}
          </template>
          <template v-else>
            <i class="fa-solid fa-triangle-exclamation text-[12px] text-[#b07f15]" aria-hidden="true"></i>
            Built · needs testing
          </template>
        </p>
      </div>

      <div>
        <p class="text-[12px] font-medium text-[#606863]">Permissions users will see</p>
        <div class="mt-1.5 flex flex-wrap gap-1">
          <UiBadge tone="muted">Save data on this device</UiBadge>
          <UiBadge v-if="needs.length" tone="gold">Internet access</UiBadge>
        </div>
      </div>

      <UiButton variant="secondary" size="sm" @click="emit('history')">
        <template #icon><i class="fa-solid fa-clock-rotate-left text-[11px]" aria-hidden="true"></i></template>
        Version history
      </UiButton>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '~/data/store'
import { appIcons, connectionNeeds, themeTones } from '~/data/studio'

const props = defineProps({
  app: { type: Object, required: true },
})

const emit = defineEmits(['config', 'rename', 'retagline', 'reicon', 'history'])

const tabs = [
  { value: 'files', label: 'Files' },
  { value: 'design', label: 'Design' },
  { value: 'review', label: 'Review' },
]

const tab = ref('design')

const swatches = {
  brand: 'bg-[#0b5d3e]',
  ink: 'bg-[#121614]',
  gold: 'bg-[#b07f15]',
  success: 'bg-[#147a4c]',
  danger: 'bg-[#b22c26]',
  muted: 'bg-[#606863]',
}

const needs = computed(() => connectionNeeds(props.app.config))

/**
 * What this build contains. The files are the app, so they are what is listed — guessing at
 * screens from a template was how a build claimed to have a Leaderboard it did not have.
 */
const screens = computed(() => (props.app.fileNames ?? []).map((name) => ({ name, net: false })))
</script>
