<!-- app/components/Ui/SectionHeading.vue -->

<template>
  <div class="flex items-end justify-between gap-4">
    <div>
      <h2 class="text-[17px] font-semibold tracking-tight text-[#121614]">{{ title }}</h2>
      <p v-if="hint" class="mt-0.5 text-[13px] text-[#606863]">{{ hint }}</p>
    </div>
    <slot name="action" />
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  hint: { type: String, default: '' },
})
</script>
