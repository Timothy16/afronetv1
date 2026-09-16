<!-- app/components/Ui/IconButton.vue -->

<!--
  The design passed size and colour overrides as extra classes on top of the
  base ones (a 36px base plus a 28px override, a grey base plus a green
  override) and left CSS order to decide the winner. Here size and tone are
  props, so only one height and one colour ever reach the element.
-->
<template>
  <button
    :aria-label="label"
    :title="label"
    class="inline-flex items-center justify-center rounded-full transition-[background-color,color,opacity] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
    :class="[size === 'sm' ? 'h-7 w-7' : 'h-9 w-9', tones[tone]]"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  // md | sm
  size: { type: String, default: 'md' },
  // default | active | brand | danger | overlay (on top of imagery)
  tone: { type: String, default: 'default' },
})

const tones = {
  default: 'text-[#606863] hover:bg-[#f7f7f4] hover:text-[#121614]',
  active: 'bg-[#f7f7f4] text-[#121614]',
  brand: 'text-[#0b5d3e] hover:bg-[#f7f7f4]',
  danger: 'bg-[#b22c26]/10 text-[#b22c26]',
  overlay: 'bg-black/40 text-white hover:bg-black/60 hover:text-white',
}
</script>
