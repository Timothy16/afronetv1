<!-- app/components/Brand/Mark.vue -->

<!--
  Afronet mark: a node with three orbiting relays that together trace the
  continent's silhouette in negative space. Network + intelligence + Africa.
  Rendered from /favicon.png so the app, the tab icon and emails share one asset.
-->
<template>
  <img src="/favicon.png" :width="size" :height="size" alt="Afronet" class="block shrink-0 select-none" draggable="false" />
</template>

<script setup>
defineProps({
  size: { type: Number, default: 28 },
})
</script>
