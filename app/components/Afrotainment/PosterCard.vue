<!-- app/components/Afrotainment/PosterCard.vue -->

<template>
  <button class="group w-[9.5rem] shrink-0 text-left sm:w-[11rem]" @click="emit('open', title)">
    <span class="relative block overflow-hidden rounded-xl border border-[#e4e4de]">
      <img
        :src="title.poster"
        :alt="title.name"
        class="aspect-[2/3] w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
      />
      <span v-if="title.downloaded" class="absolute left-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] text-white">
        Offline
      </span>
      <span v-if="title.progress" class="absolute inset-x-0 bottom-0 block bg-black/40 p-1.5">
        <UiProgress :value="title.progress" tone="gold" />
      </span>
    </span>
    <span class="mt-2 block truncate text-[13px] text-[#121614]">{{ title.name }}</span>
    <span class="block text-[11px] text-[#8f9792]">{{ title.kind }} · {{ title.country }}</span>
  </button>
</template>

<script setup>
defineProps({
  // An entry from data/media.js `titles`
  title: { type: Object, required: true },
})

const emit = defineEmits(['open'])
</script>
