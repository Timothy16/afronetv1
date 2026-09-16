<!-- app/components/Ui/Modal.vue -->

<!--
  Bottom sheet on mobile, centred dialog from sm up. Teleported to <body> so no
  ancestor with backdrop-filter (the top bar and the mobile tab bar both have
  one) can become the containing block for its fixed positioning.
-->
<template>
  <Teleport to="body">
    <Transition name="modal" :duration="250">
      <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
        <div class="modal-backdrop absolute inset-0 bg-black/40" @click="emit('close')" />
        <div
          role="dialog"
          aria-modal="true"
          :aria-label="title"
          class="modal-panel afro-scroll relative max-h-[88vh] w-full overflow-y-auto rounded-t-3xl border border-[#e4e4de] bg-[#ffffff] p-6 text-[#121614] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)] sm:rounded-2xl"
          :class="width"
        >
          <div class="mb-5 flex items-start justify-between gap-6">
            <div>
              <h2 class="text-[17px] font-semibold tracking-tight text-[#121614]">{{ title }}</h2>
              <p v-if="description" class="mt-1 text-[13px] text-[#606863]">{{ description }}</p>
            </div>
            <UiIconButton label="Close" @click="emit('close')">
              <i class="fa-solid fa-xmark text-[14px]" aria-hidden="true"></i>
            </UiIconButton>
          </div>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  // A max-width utility, e.g. max-w-3xl
  width: { type: String, default: 'max-w-lg' },
})

const emit = defineEmits(['close'])

const onKey = (e) => {
  if (e.key === 'Escape') emit('close')
}

watch(
  () => props.open,
  (open) => {
    if (open) window.addEventListener('keydown', onKey)
    else window.removeEventListener('keydown', onKey)
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey)
})
</script>

<style scoped>
/* Backdrop fades; the panel rises and settles. Both run inside one
   <Transition>, which is held open for the longer of the two (250ms). */
.modal-enter-active .modal-backdrop,
.modal-leave-active .modal-backdrop {
  transition: opacity 0.2s cubic-bezier(0.23, 1, 0.32, 1);
}

.modal-enter-active .modal-panel,
.modal-leave-active .modal-panel {
  transition:
    opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1),
    transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}

.modal-enter-from .modal-backdrop,
.modal-leave-to .modal-backdrop {
  opacity: 0;
}

.modal-enter-from .modal-panel {
  opacity: 0;
  transform: translateY(16px) scale(0.98);
}

.modal-leave-to .modal-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .modal-enter-active .modal-backdrop,
  .modal-leave-active .modal-backdrop,
  .modal-enter-active .modal-panel,
  .modal-leave-active .modal-panel {
    transition: none;
  }
}
</style>
