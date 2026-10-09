<!-- app/components/Landing/FormField.vue -->

<!--
  A labelled field that can show an error. UiField only carries a neutral
  hint, and an error rendered in hint grey is not an error — so this wraps it
  and puts the message in danger red underneath instead.
-->
<template>
  <UiField :label="label" :hint="error ? '' : hint">
    <slot />
    <span v-if="error" class="mt-1.5 flex items-center gap-1.5 text-[12px] text-[#b22c26]">
      <i class="fa-solid fa-circle-exclamation text-[10px]" aria-hidden="true"></i>
      {{ error }}
    </span>
  </UiField>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: '' },
  error: { type: String, default: '' },
})
</script>
