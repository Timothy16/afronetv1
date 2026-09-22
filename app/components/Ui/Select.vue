<!-- app/components/Ui/Select.vue -->

<!-- Native select styled to match UiInput. The bound value is option[valueKey] (an id), never the label. -->
<template>
  <div class="relative">
    <select
      v-model="model"
      class="w-full appearance-none rounded-xl border border-[#e4e4de] bg-[#ffffff] pl-3.5 pr-9 transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus:border-[#0b5d3e] disabled:opacity-60"
      :class="[sizes[size], model === null || model === '' ? 'text-[#8f9792]' : 'text-[#121614]']"
    >
      <option :value="null" disabled>{{ placeholder }}</option>
      <option v-for="o in options" :key="o[valueKey]" :value="o[valueKey]" class="text-[#121614]">
        {{ o[labelKey] }}
      </option>
    </select>
    <i
      class="fa-solid fa-chevron-down pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-[11px] text-[#8f9792]"
      aria-hidden="true"
    ></i>
  </div>
</template>

<script setup>
defineProps({
  options: { type: Array, default: () => [] },
  valueKey: { type: String, default: 'id' },
  labelKey: { type: String, default: 'name' },
  placeholder: { type: String, default: 'Select' },
  // md | sm | lg — same heights as UiInput
  size: { type: String, default: 'md' },
})

const sizes = {
  sm: 'h-9 text-[13px]',
  md: 'h-11 text-sm',
  lg: 'h-12 text-sm',
}

const model = defineModel({ type: [String, Number], default: null })
</script>
