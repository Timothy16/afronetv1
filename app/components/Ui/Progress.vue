<!-- app/components/Ui/Progress.vue -->

<template>
  <div class="h-1.5 w-full overflow-hidden rounded-full bg-[#f7f7f4]">
    <div
      class="h-full rounded-full transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="bars[tone]"
      :style="{ width: `${Math.min(100, Math.max(0, value))}%` }"
    />
  </div>
</template>

<script setup>
defineProps({
  value: { type: Number, required: true },
  // brand | gold | ink
  tone: { type: String, default: 'brand' },
})

const bars = {
  brand: 'bg-[#0b5d3e]',
  gold: 'bg-[#b07f15]',
  ink: 'bg-[#121614]',
}
</script>
