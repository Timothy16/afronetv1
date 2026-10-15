<!-- app/components/Store/AppIcon.vue -->

<!--
  An app's tile. The design gave every app its own hex; here each app carries a palette
  token instead, so the catalogue can grow without ever introducing a colour that is not
  Afronet's. `muted` is for an app that has been suspended.
-->
<template>
  <span
    class="flex shrink-0 items-center justify-center text-[#ffffff]"
    :class="[sizes[size], muted ? 'bg-[#8f9792] opacity-60' : tones[tone] ?? tones.ink]"
    aria-hidden="true"
  >
    <i class="fa-solid" :class="[icon, glyphs[size]]"></i>
  </span>
</template>

<script setup>
defineProps({
  // A Font Awesome 6 solid class, e.g. fa-list-check
  icon: { type: String, required: true },
  // brand | ink | gold | success | danger | muted
  tone: { type: String, default: 'ink' },
  // xs | sm | md | lg | xl
  size: { type: String, default: 'md' },
  muted: { type: Boolean, default: false },
})

const tones = {
  brand: 'bg-[#0b5d3e]',
  ink: 'bg-[#121614]',
  gold: 'bg-[#b07f15]',
  success: 'bg-[#147a4c]',
  danger: 'bg-[#b22c26]',
  muted: 'bg-[#606863]',
}

const sizes = {
  xs: 'h-7 w-7 rounded-lg',
  sm: 'h-10 w-10 rounded-xl',
  md: 'h-12 w-12 rounded-[14px]',
  lg: 'h-16 w-16 rounded-[18px]',
  xl: 'h-20 w-20 rounded-[22px]',
}

const glyphs = {
  xs: 'text-[12px]',
  sm: 'text-[15px]',
  md: 'text-[18px]',
  lg: 'text-[24px]',
  xl: 'text-[30px]',
}
</script>
