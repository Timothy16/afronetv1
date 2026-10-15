<!-- app/components/Store/StorageBar.vue -->

<!--
  What a download is actually made of: the unpacked app, the kept package file, the cache
  it builds and the data you save in it. Shown as one bar because that is how the phone
  sees it, and with a legend because each part is freed by a different action.
-->
<template>
  <div>
    <div
      class="flex w-full overflow-hidden rounded-full bg-[#f7f7f4]"
      :class="height === 'sm' ? 'h-2' : 'h-2.5'"
      role="img"
      :aria-label="summary"
    >
      <div
        v-for="s in segments"
        :key="s.label"
        class="h-full border-r border-[#ffffff]/70 last:border-0"
        :class="tones[s.tone] ?? tones.ink"
        :style="{ width: `${width(s.mb)}%` }"
      />
    </div>

    <ul v-if="legend" class="mt-2.5 flex flex-wrap gap-x-4 gap-y-1">
      <li v-for="s in segments" :key="s.label" class="flex items-center gap-1.5 text-[12px] text-[#606863]">
        <span class="h-2 w-2 rounded-full" :class="tones[s.tone] ?? tones.ink" />
        {{ s.label }}
        <span class="font-semibold text-[#121614]">{{ formatMB(s.mb) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { formatMB } from '~/data/store'

const props = defineProps({
  // [{ label, mb, tone }] — tone: ink | brand | gold | subtle
  segments: { type: Array, required: true },
  total: { type: Number, required: true },
  legend: { type: Boolean, default: true },
  // md | sm
  height: { type: String, default: 'md' },
})

const tones = {
  ink: 'bg-[#121614]',
  brand: 'bg-[#0b5d3e]',
  gold: 'bg-[#b07f15]',
  subtle: 'bg-[#8f9792]',
}

const width = (mb) => Math.max(0, (mb / Math.max(props.total, 1)) * 100)

const summary = computed(() => props.segments.map((s) => `${s.label} ${formatMB(s.mb)}`).join(', '))
</script>
