<!-- app/components/Ui/SegmentedControl.vue -->

<template>
  <div role="tablist" class="inline-flex items-center gap-0.5 rounded-xl border border-[#e4e4de] bg-[#f7f7f4] p-0.5">
    <button
      v-for="o in options"
      :key="o.value"
      role="tab"
      :aria-selected="model === o.value ? 'true' : 'false'"
      class="rounded-[10px] font-medium transition-[background-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="[
        size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3.5 py-1.5 text-[13px]',
        model === o.value ? 'bg-[#ffffff] text-[#121614] shadow-sm' : 'text-[#606863] hover:text-[#121614]',
      ]"
      @click="model = o.value"
    >
      {{ o.label }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  // [{ value, label }]
  options: { type: Array, required: true },
  // md | sm
  size: { type: String, default: 'md' },
})

const model = defineModel({ type: String, required: true })
</script>
