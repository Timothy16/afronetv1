<!-- app/components/Store/Stars.vue -->

<!-- Five stars, filled to a rating. Display only — the review dialog draws its own. -->
<template>
  <span class="inline-flex items-center gap-0.5" role="img" :aria-label="`${value} out of 5`">
    <i
      v-for="n in 5"
      :key="n"
      class="fa-solid fa-star"
      :class="[sizes[size], n <= Math.round(value) ? 'text-[#b07f15]' : 'text-[#e4e4de]']"
      aria-hidden="true"
    ></i>
  </span>
</template>

<script setup>
defineProps({
  value: { type: Number, required: true },
  // sm | md
  size: { type: String, default: 'sm' },
})

const sizes = {
  sm: 'text-[10px]',
  md: 'text-[13px]',
}
</script>
