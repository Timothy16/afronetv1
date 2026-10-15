<!-- app/components/Store/AppRow.vue -->

<!--
  A horizontal rail of app tiles — "Ready for offline", "Trending", and the rest. Renders
  nothing at all when its list is empty, so the home page never shows a heading with a gap
  under it.
-->
<template>
  <section v-if="apps.length" class="mt-9">
    <div class="mb-2 flex items-end justify-between gap-4 px-2">
      <div>
        <h2 class="text-[17px] font-semibold tracking-tight text-[#121614]">{{ title }}</h2>
        <p v-if="subtitle" class="text-[13px] text-[#606863]">{{ subtitle }}</p>
      </div>
      <NuxtLink
        v-if="seeAll"
        :to="seeAll"
        class="whitespace-nowrap text-[13px] font-medium text-[#0b5d3e] hover:underline"
      >
        See all
      </NuxtLink>
    </div>
    <div class="no-scrollbar -mx-2 flex gap-1 overflow-x-auto px-2 pb-1">
      <StoreAppCard v-for="a in apps" :key="a.id" :app="a" variant="tile" />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  apps: { type: Array, required: true },
  seeAll: { type: String, default: '' },
})
</script>
