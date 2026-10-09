<!-- app/components/Landing/Badge.vue -->

<!--
  What a feature actually needs, said next to the feature itself.
  Four states: available now, supported devices only, needs local AFRONET
  connectivity, or still coming. The dashed variant marks the ones that do not
  exist yet, so they never read like a promise.
-->
<template>
  <span
    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
    :class="tones[onDark ? `${badge.tone}Dark` : badge.tone] || tones[badge.tone]"
  >
    <i class="fa-solid text-[10px]" :class="badge.icon" aria-hidden="true"></i>
    {{ badge.label }}
  </span>
</template>

<script setup>
import { availability } from '~/data/landing'

const props = defineProps({
  // available | devices | local | soon
  status: { type: String, required: true },
  onDark: { type: Boolean, default: false },
})

const tones = {
  brand: 'bg-[#eaf3ee] text-[#0b5d3e]',
  brandDark: 'bg-[#eaf3ee] text-[#0b5d3e]',
  gold: 'bg-[#faf3e3] text-[#b07f15]',
  goldDark: 'bg-[#faf3e3] text-[#b07f15]',
  outline: 'bg-[#f7f7f4] text-[#606863] ring-1 ring-inset ring-[#e4e4de]',
  outlineDark: 'bg-[#ffffff]/10 text-[#ffffff]/85 ring-1 ring-inset ring-[#ffffff]/20',
  dashed: 'border border-dashed border-[#8f9792]/60 text-[#606863]',
  dashedDark: 'border border-dashed border-[#ffffff]/40 text-[#ffffff]/85',
}

const badge = computed(() => availability[props.status] ?? availability.soon)
</script>
