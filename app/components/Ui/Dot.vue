<!-- app/components/Ui/Dot.vue -->

<template>
  <span class="inline-block h-1.5 w-1.5 rounded-full" :class="colors[tone] ?? 'bg-[#8f9792]'" />
</template>

<script setup>
defineProps({
  // brand | gold | danger | success — anything else renders faint
  tone: { type: String, default: 'brand' },
})

const colors = {
  brand: 'bg-[#0b5d3e]',
  gold: 'bg-[#b07f15]',
  danger: 'bg-[#b22c26]',
  success: 'bg-[#147a4c]',
}
</script>
