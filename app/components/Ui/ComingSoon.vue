<!-- app/components/Ui/ComingSoon.vue -->

<template>
  <span
    class="inline-flex items-center rounded-full border border-[#b07f15]/40 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#b07f15]"
  >
    {{ label }}
  </span>
</template>

<script setup>
defineProps({
  label: { type: String, default: 'Coming soon' },
})
</script>
