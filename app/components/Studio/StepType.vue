<!-- app/components/Studio/StepType.vue -->

<!-- Step two: what kind of app it is. This becomes the store category, so it is asked once. -->
<template>
  <div>
    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614]">
      What type of app is it?
    </h1>
    <p class="mt-1 text-[14px] text-[#606863]">
      This helps the generator pick a layout, and it sets the category people will find it under.
    </p>

    <div class="mt-5 grid gap-2 sm:grid-cols-2">
      <button
        v-for="t in appTypes"
        :key="t.id"
        :aria-pressed="model === t.id ? 'true' : 'false'"
        class="flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-[14px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :class="model === t.id ? 'border-[#121614] bg-[#f7f7f4] text-[#121614]' : 'border-[#e4e4de] text-[#121614] hover:bg-[#f7f7f4]'"
        @click="model = t.id"
      >
        <i class="fa-solid w-4 text-center text-[13px] text-[#606863]" :class="t.icon" aria-hidden="true"></i>
        {{ t.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { appTypes } from '~/data/studio'

const model = defineModel({ type: String, default: 'education' })
</script>
