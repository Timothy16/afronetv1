<!-- app/components/Brand/Logo.vue -->

<template>
  <span class="inline-flex items-center gap-2.5">
    <BrandMark :size="size" />
    <span v-if="showWord" class="text-[17px] font-semibold tracking-[-0.02em] text-[#121614]">Afronet</span>
  </span>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 28 },
  showWord: { type: Boolean, default: true },
})
</script>
