<!-- app/components/Ui/Row.vue -->

<!-- A settings-style row: label and hint on the left, value and action on the right. -->
<template>
  <div class="flex items-center justify-between gap-4 py-3.5">
    <div class="min-w-0">
      <p class="truncate text-sm text-[#121614]">{{ label }}</p>
      <p v-if="hint" class="mt-0.5 text-[12px] text-[#8f9792]">{{ hint }}</p>
    </div>
    <div class="flex shrink-0 items-center gap-3 text-sm text-[#606863]">
      <slot name="value">{{ value }}</slot>
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  // Plain-text value; use the `value` slot for anything richer.
  value: { type: [String, Number], default: '' },
  hint: { type: String, default: '' },
})
</script>
