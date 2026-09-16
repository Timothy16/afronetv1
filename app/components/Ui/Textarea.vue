<!-- app/components/Ui/Textarea.vue -->

<template>
  <textarea
    v-model="model"
    class="w-full rounded-xl border border-[#e4e4de] bg-[#ffffff] p-3.5 text-sm leading-relaxed text-[#121614] transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] placeholder:text-[#8f9792] focus:border-[#0b5d3e]"
  />
</template>

<script setup>
const model = defineModel({ type: String, default: '' })
</script>
