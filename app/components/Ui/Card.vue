<!-- app/components/Ui/Card.vue -->

<template>
  <div
    class="rounded-2xl border border-[#e4e4de] bg-[#ffffff]"
    :class="
      interactive
        ? 'transition-[border-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/40 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]'
        : ''
    "
  >
    <slot />
  </div>
</template>

<script setup>
defineProps({
  interactive: { type: Boolean, default: false },
})
</script>
