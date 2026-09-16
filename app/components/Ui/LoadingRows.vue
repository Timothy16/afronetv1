<!-- app/components/Ui/LoadingRows.vue -->

<template>
  <div class="space-y-3" role="status" aria-label="Loading">
    <div v-for="i in rows" :key="i" class="flex items-center gap-3">
      <div class="h-9 w-9 shrink-0 animate-pulse rounded-full bg-[#f7f7f4]" />
      <div class="w-full space-y-2">
        <div class="h-3 w-1/3 animate-pulse rounded-full bg-[#f7f7f4]" />
        <div class="h-3 w-2/3 animate-pulse rounded-full bg-[#f7f7f4]" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 4 },
})
</script>
