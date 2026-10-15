<!-- app/components/Studio/StepDesign.vue -->

<!--
  Step four: name and look. The colours are Afronet's own palette offered by name — a
  developer picks a theme, not a hex, so no published app can introduce a colour the rest
  of the platform does not use.

  Larger text and high contrast are here rather than buried in settings because they are
  the two things that decide whether an app is usable on a cheap screen in daylight.
-->
<template>
  <div>
    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614]">Name and style</h1>
    <p class="mt-1 text-[14px] text-[#606863]">All of this can be changed afterwards in the builder.</p>

    <UiField label="App name" hint="Leave it blank and we’ll name it from your description." class="mt-5">
      <UiInput v-model="model.name" placeholder="Chem Past Questions" />
    </UiField>

    <p class="mb-2 mt-5 text-[13px] font-medium text-[#121614]">Theme colour</p>
    <div class="flex flex-wrap gap-2">
      <button
        v-for="t in themeTones"
        :key="t.id"
        :aria-pressed="model.tone === t.id ? 'true' : 'false'"
        :aria-label="t.label"
        class="flex items-center gap-2 rounded-xl border px-3 py-2 text-[12.5px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :class="model.tone === t.id ? 'border-[#121614] bg-[#f7f7f4] text-[#121614]' : 'border-[#e4e4de] text-[#606863]'"
        @click="model.tone = t.id"
      >
        <span class="h-4 w-4 rounded-full" :class="swatches[t.id]" />
        {{ t.label }}
      </button>
    </div>

    <p class="mb-2 mt-5 text-[13px] font-medium text-[#121614]">Layout</p>
    <div class="flex gap-2">
      <button
        v-for="l in layouts"
        :key="l"
        :aria-pressed="model.layout === l ? 'true' : 'false'"
        class="rounded-xl border px-4 py-2 text-[13px] font-medium capitalize transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :class="model.layout === l ? 'border-[#121614] bg-[#f7f7f4] text-[#121614]' : 'border-[#e4e4de] text-[#606863]'"
        @click="model.layout = l"
      >
        {{ l }}
      </button>
    </div>

    <div class="mt-5 divide-y divide-[#e4e4de] border-y border-[#e4e4de]">
      <UiRow label="Larger text" hint="Easier to read on small screens.">
        <template #value>
          <UiToggle v-model="model.fontScale" label="Larger text" />
        </template>
      </UiRow>
      <UiRow label="High contrast" hint="Stronger text contrast for bright sunlight.">
        <template #value>
          <UiToggle v-model="model.highContrast" label="High contrast" />
        </template>
      </UiRow>
    </div>
  </div>
</template>

<script setup>
import { themeTones } from '~/data/studio'

// { name, tone, layout, fontScale (boolean: large), highContrast }
const model = defineModel({ type: Object, required: true })

const layouts = ['cards', 'list']

const swatches = {
  brand: 'bg-[#0b5d3e]',
  ink: 'bg-[#121614]',
  gold: 'bg-[#b07f15]',
  success: 'bg-[#147a4c]',
  danger: 'bg-[#b22c26]',
  muted: 'bg-[#606863]',
}
</script>
