<!-- app/components/Ui/Toggle.vue -->

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="model ? 'true' : 'false'"
    :aria-label="label"
    class="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
    :class="model ? 'bg-[#0b5d3e]' : 'border border-[#e4e4de] bg-[#f7f7f4]'"
    @click="model = !model"
  >
    <span
      class="absolute top-1/2 block h-[18px] w-[18px] -translate-y-1/2 rounded-full bg-white shadow-sm transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="model ? 'translate-x-[24px]' : 'translate-x-[3px]'"
    />
  </button>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
})

const model = defineModel({ type: Boolean, default: false })
</script>
