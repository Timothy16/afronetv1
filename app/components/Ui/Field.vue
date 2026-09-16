<!-- app/components/Ui/Field.vue -->

<template>
  <label class="block">
    <span class="mb-1.5 block text-[13px] font-medium text-[#121614]">{{ label }}</span>
    <slot />
    <span v-if="hint" class="mt-1.5 block text-[12px] text-[#8f9792]">{{ hint }}</span>
  </label>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
})
</script>
