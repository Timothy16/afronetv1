<!-- app/components/Store/DemoTag.vue -->

<!--
  Marks a figure as made up. While the store runs on mock data this sits beside anything a
  person might otherwise take for a real number — install counts, ratings, storage, money.
  When the screens are wired to real data these tags come out.
-->
<template>
  <span
    class="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-dashed border-[#8f9792]/60 px-1.5 py-0.5 text-[10.5px] font-medium uppercase tracking-wide text-[#8f9792]"
  >
    <i class="fa-solid fa-flask text-[9px]" aria-hidden="true"></i>
    {{ label }}
  </span>
</template>

<script setup>
defineProps({
  label: { type: String, default: 'Demo data' },
})
</script>
