<!-- app/components/Ui/Badge.vue -->

<template>
  <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" :class="tones[tone]">
    <slot />
  </span>
</template>

<script setup>
defineProps({
  // brand | gold | muted | danger | success | outline
  tone: { type: String, default: 'muted' },
})

const tones = {
  brand: 'bg-[#eaf3ee] text-[#0b5d3e]',
  gold: 'bg-[#faf3e3] text-[#b07f15]',
  muted: 'bg-[#f7f7f4] text-[#606863]',
  danger: 'bg-[#b22c26]/10 text-[#b22c26]',
  success: 'bg-[#147a4c]/10 text-[#147a4c]',
  outline: 'border border-[#e4e4de] text-[#606863]',
}
</script>
