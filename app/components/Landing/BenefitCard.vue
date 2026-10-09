<!-- app/components/Landing/BenefitCard.vue -->

<!--
  One of the three About cards. The first is filled dark so the row has a
  focal point; the others sit on white. Each bullet can carry its own
  availability badge, which is the point of the card — the claim and its
  caveat travel together.
-->
<template>
  <article
    class="flex h-full flex-col rounded-[24px] p-6"
    :class="dark ? 'bg-[#121614] text-[#ffffff]' : 'bg-[#ffffff] ring-1 ring-[#e4e4de]'"
  >
    <span
      class="grid h-11 w-11 place-items-center rounded-2xl"
      :class="dark ? 'bg-[#0b5d3e] text-[#ffffff]' : 'bg-[#eaf3ee] text-[#0b5d3e]'"
    >
      <i class="fa-solid text-[17px]" :class="benefit.icon" aria-hidden="true"></i>
    </span>

    <h3
      class="mt-5 font-['Instrument_Serif',Georgia,serif] text-[22px] leading-snug tracking-tight"
      :class="dark ? 'text-[#ffffff]' : 'text-[#121614]'"
    >
      {{ benefit.title }}
    </h3>
    <p class="mt-2 text-sm leading-relaxed" :class="dark ? 'text-[#ffffff]/70' : 'text-[#606863]'">
      {{ benefit.description }}
    </p>

    <ul class="mt-5 space-y-3.5">
      <li v-for="point in benefit.points" :key="point.text" class="flex gap-2.5 text-sm">
        <i
          class="fa-solid fa-check mt-1 shrink-0 text-[11px]"
          :class="dark ? 'text-[#eaf3ee]' : 'text-[#0b5d3e]'"
          aria-hidden="true"
        ></i>
        <span class="flex flex-col items-start gap-1.5">
          <span :class="dark ? 'text-[#ffffff]/90' : 'text-[#121614]'">{{ point.text }}</span>
          <LandingBadge v-if="point.status" :status="point.status" :on-dark="dark" />
        </span>
      </li>
    </ul>
  </article>
</template>

<script setup>
defineProps({
  // one entry of benefits in data/landing.js
  benefit: { type: Object, required: true },
  dark: { type: Boolean, default: false },
})
</script>
