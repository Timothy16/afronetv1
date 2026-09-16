<!-- app/components/Ui/Input.vue -->

<template>
  <input
    v-model="model"
    class="w-full rounded-xl border border-[#e4e4de] bg-[#ffffff] px-3.5 text-[#121614] transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-[#8f9792] focus:border-[#0b5d3e]"
    :class="sizes[size]"
  />
</template>

<script setup>
defineProps({
  // md | sm | lg — sm is the compact search in list panes, lg the page-level search bar
  size: { type: String, default: 'md' },
})

const sizes = {
  sm: 'h-9 text-[13px]',
  md: 'h-11 text-sm',
  lg: 'h-12 text-sm',
}

const model = defineModel({ type: [String, Number], default: '' })
</script>
