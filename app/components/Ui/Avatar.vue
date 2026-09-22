<!-- app/components/Ui/Avatar.vue -->

<template>
  <span class="relative inline-block shrink-0" :style="{ width: `${size}px`, height: `${size}px` }">
    <img v-if="src" :src="src" :alt="name" :width="size" :height="size" class="h-full w-full rounded-full object-cover" />
    <!-- No image yet: initials on the brand tint -->
    <span
      v-else
      role="img"
      :aria-label="name"
      class="flex h-full w-full items-center justify-center rounded-full bg-[#eaf3ee] font-medium text-[#0b5d3e]"
      :style="{ fontSize: `${Math.round(size * 0.38)}px` }"
    >
      {{ initials }}
    </span>
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
  src: { type: String, default: '' },
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

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join(''),
)
</script>
