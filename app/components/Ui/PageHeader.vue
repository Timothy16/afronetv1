<!-- app/components/Ui/PageHeader.vue -->

<template>
  <header class="flex flex-wrap items-end justify-between gap-4 border-b border-[#e4e4de] pb-6">
    <div class="max-w-2xl">
      <p v-if="eyebrow" class="mb-2 text-[12px] font-medium text-[#0b5d3e]">{{ eyebrow }}</p>
      <h1 class="font-['Instrument_Serif',Georgia,serif] text-[34px] leading-[1.1] text-[#121614]">{{ title }}</h1>
      <p v-if="description" class="mt-2 text-[15px] leading-relaxed text-[#606863]">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-2">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, required: true },
  description: { type: String, default: '' },
})
</script>
