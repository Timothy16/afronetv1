<!-- app/components/Explore/Badge.vue -->

<!--
  Whether a step is something you can use today, something coming, or part of
  the longer-term vision. Five of the thirteen steps do not exist yet, so this
  is the difference between a tour and a set of promises.
-->
<template>
  <span
    class="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold"
    :class="onDark ? 'bg-[#ffffff]/10 text-[#ffffff]/90' : badge.chip"
  >
    <span class="h-1.5 w-1.5 rounded-full" :class="onDark ? 'bg-[#ffffff]/70' : badge.dot" aria-hidden="true"></span>
    {{ badge.label }}
  </span>
</template>

<script setup>
import { exploreStatuses } from '~/data/explore'

const props = defineProps({
  // now | soon | future
  status: { type: String, required: true },
  onDark: { type: Boolean, default: false },
})

const badge = computed(() => exploreStatuses[props.status] ?? exploreStatuses.future)
</script>
