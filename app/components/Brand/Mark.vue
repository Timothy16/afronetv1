<!-- app/components/Brand/Mark.vue -->

<!--
  Afronet mark: a node with three orbiting relays that together trace the
  continent's silhouette in negative space. Network + intelligence + Africa.
-->
<template>
  <svg :width="size" :height="size" viewBox="0 0 32 32" fill="none" role="img" aria-label="Afronet">
    <rect width="32" height="32" rx="9" fill="#0b5d3e" />
    <circle cx="16" cy="16" r="3.4" fill="#ffffff" />
    <circle cx="16" cy="6.5" r="2" fill="#b07f15" />
    <circle cx="24.5" cy="21.5" r="2" fill="#ffffff" opacity="0.85" />
    <circle cx="7.5" cy="21.5" r="2" fill="#ffffff" opacity="0.85" />
    <path
      d="M16 8.5v4.2M18.6 17.8l4 2.4M13.4 17.8l-4 2.4"
      stroke="#ffffff"
      stroke-width="1.4"
      stroke-linecap="round"
      opacity="0.9"
    />
  </svg>
</template>

<script setup>
defineProps({
  size: { type: Number, default: 28 },
})
</script>
