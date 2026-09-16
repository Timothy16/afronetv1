<!-- app/components/Ui/Avatar.vue -->

<template>
  <span class="relative inline-block shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <img :src="src" :alt="name" :width="size" :height="size" class="h-full w-full rounded-full object-cover" />
    <span
      v-if="presence"
      aria-hidden="true"
      class="absolute bottom-0 right-0 rounded-full border-2 border-[#ffffff]"
      :class="presenceColor[presence]"
      :style="{ width: `${dot}px`, height: `${dot}px` }"
    />
  </span>
</template>

<script setup>
const props = defineProps({
  src: { type: String, required: true },
  name: { type: String, required: true },
  size: { type: Number, default: 40 },
  // afronet | both | internet | offline | dnd
  presence: { type: String, default: '' },
})

const presenceColor = {
  afronet: 'bg-[#0b5d3e]',
  both: 'bg-[#0b5d3e]',
  internet: 'bg-[#b07f15]',
  offline: 'bg-[#8f9792]',
  dnd: 'bg-[#b22c26]',
}

const dot = computed(() => Math.max(9, props.size * 0.28))
</script>
