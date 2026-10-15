<!-- app/components/Store/ConfirmDialog.vue -->

<!--
  Used before anything is removed. The store deletes nothing without one of these, and the
  button says what will happen ("Uninstall", "Delete data") rather than "OK".
-->
<template>
  <UiModal :open="open" :title="title" @close="emit('close')">
    <div class="text-[13.5px] leading-relaxed text-[#606863]">
      <slot />
    </div>

    <div class="mt-6 flex flex-wrap justify-end gap-2">
      <UiButton variant="secondary" @click="emit('close')">{{ cancelLabel }}</UiButton>
      <UiButton :variant="tone === 'danger' ? 'danger' : 'primary'" @click="confirm">
        {{ confirmLabel }}
      </UiButton>
    </div>
  </UiModal>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  confirmLabel: { type: String, default: 'Confirm' },
  cancelLabel: { type: String, default: 'Cancel' },
  // danger | primary
  tone: { type: String, default: 'danger' },
})

const emit = defineEmits(['close', 'confirm'])

// The caller acts on `confirm`; closing is this component's business either way.
const confirm = () => {
  emit('confirm')
  emit('close')
}
</script>
