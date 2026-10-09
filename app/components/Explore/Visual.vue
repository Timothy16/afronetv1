<!-- app/components/Explore/Visual.vue -->

<!--
  The picture half of a step. A photograph where one exists, the step's own
  bullet points for the three capability steps, and a drawn mock for the
  features that have no photograph.

  Anything not yet built is stamped "Concept preview", on the image, so a
  mock is never mistaken for a screenshot of something shipping.
-->
<template>
  <div class="relative h-full w-full overflow-hidden rounded-[28px] bg-[#121614]">
    <img
      v-if="step.photo"
      :src="step.photo"
      :alt="step.photoAlt || ''"
      class="h-full w-full object-cover"
      draggable="false"
    />

    <!-- The three capability steps: their claims and caveats -->
    <div
      v-else-if="step.visual === 'points'"
      class="afro-scroll flex h-full flex-col justify-center gap-3.5 overflow-y-auto bg-[#121614] px-5 pb-14 pt-12 sm:gap-5 sm:px-8 sm:pb-16"
    >
      <span class="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#0b5d3e] text-[#ffffff] sm:h-12 sm:w-12">
        <i class="fa-solid text-[16px] sm:text-[18px]" :class="step.icon" aria-hidden="true"></i>
      </span>
      <ul class="space-y-3 sm:space-y-4">
        <li v-for="point in step.points" :key="point.text" class="flex gap-2.5 sm:gap-3">
          <i class="fa-solid fa-check mt-1 shrink-0 text-[11px] text-[#eaf3ee]" aria-hidden="true"></i>
          <span class="flex flex-col items-start gap-1.5 sm:gap-2">
            <span class="text-[13px] leading-relaxed text-[#ffffff]/90 sm:text-sm">{{ point.text }}</span>
            <LandingBadge v-if="point.status" :status="point.status" on-dark />
          </span>
        </li>
      </ul>
    </div>

    <!-- African Intelligence -->
    <div v-else-if="step.visual === 'ai'" class="flex h-full flex-col items-center justify-center gap-4 bg-[#eaf3ee] px-5 pb-14 pt-12 sm:gap-5 sm:p-8">
      <span class="grid h-16 w-16 place-items-center rounded-full bg-[#0b5d3e] text-[#ffffff] sm:h-24 sm:w-24">
        <i class="fa-solid fa-microphone text-[22px] sm:text-[28px]" aria-hidden="true"></i>
      </span>
      <p class="max-w-xs text-center text-sm font-medium text-[#0b5d3e]">{{ visuals.ai.prompt }}</p>
      <div class="flex flex-wrap justify-center gap-1.5">
        <span
          v-for="(chip, i) in visuals.ai.chips"
          :key="chip"
          class="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          :class="i === 0 ? 'bg-[#0b5d3e] text-[#ffffff]' : 'bg-[#ffffff] text-[#0b5d3e]'"
        >
          {{ chip }}
        </span>
      </div>
    </div>

    <!-- App store -->
    <div class="grid h-full grid-cols-3 content-center gap-x-3 gap-y-4 bg-[#f7f7f4] px-5 pb-14 pt-12 sm:gap-x-4 sm:gap-y-6 sm:p-7" v-else-if="step.visual === 'apps'">
      <div v-for="app in visuals.apps" :key="app" class="flex min-w-0 flex-col items-center gap-2">
        <span class="grid h-10 w-10 place-items-center rounded-2xl bg-[#ffffff] ring-1 ring-[#e4e4de] sm:h-12 sm:w-12">
          <i class="fa-solid fa-cube text-[16px] text-[#0b5d3e]" aria-hidden="true"></i>
        </span>
        <span class="w-full truncate text-center text-[11px] font-medium text-[#121614]">{{ app }}</span>
      </div>
    </div>

    <!-- Developer platform -->
    <div
      v-else-if="step.visual === 'developers'"
      class="afro-scroll flex h-full flex-col justify-center overflow-x-auto bg-[#121614] px-5 pb-14 pt-12 font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[11px] leading-relaxed sm:p-6 sm:text-[12px]"
    >
      <span
        v-for="(line, i) in visuals.developers"
        :key="i"
        :class="[line.tone === 'comment' ? 'text-[#ffffff]/45' : 'text-[#ffffff]/90', indents[line.indent || 0]]"
      >
        {{ line.text }}
      </span>
      <span class="mt-3 inline-flex items-center gap-2 text-[#8fd3b4]">
        <i class="fa-solid fa-tower-broadcast text-[11px]" aria-hidden="true"></i>
        {{ visuals.developersResult }}
      </span>
    </div>

    <!-- Livestream -->
    <div v-else-if="step.visual === 'livestream'" class="flex h-full flex-col justify-between bg-[#0b5d3e] px-5 pb-14 pt-4 text-[#ffffff] sm:p-6 sm:pb-16">
      <span
        class="ml-auto mt-8 inline-flex w-fit items-center gap-1.5 rounded-md bg-[#b22c26] px-2 py-0.5 text-[11px] font-bold"
      >
        ● LIVE
      </span>
      <div>
        <p class="text-[12px] text-[#ffffff]/70">{{ visuals.livestream.meta }}</p>
        <p class="mt-1 text-lg font-semibold leading-snug">{{ visuals.livestream.title }}</p>
        <div class="mt-4 h-1 w-full rounded-full bg-[#ffffff]/25">
          <div class="h-1 w-2/3 rounded-full bg-[#ffffff]"></div>
        </div>
      </div>
    </div>

    <!-- Entertainment -->
    <div v-else class="grid h-full grid-cols-2 gap-2.5 bg-[#121614] px-5 pb-14 pt-12 sm:gap-3 sm:p-6 sm:pt-14">
      <div
        v-for="(tile, i) in visuals.media"
        :key="tile.label"
        class="flex flex-col justify-between rounded-2xl p-4 text-[#ffffff]"
        :class="tileTones[i % tileTones.length]"
      >
        <i class="fa-solid text-[20px]" :class="tile.icon" aria-hidden="true"></i>
        <span class="text-sm font-semibold">{{ tile.label }}</span>
      </div>
    </div>

    <span
      v-if="step.status !== 'now'"
      class="absolute left-3 top-3 rounded-full bg-[#121614]/75 px-2.5 py-1 text-[11px] font-semibold text-[#ffffff]"
    >
      Concept preview
    </span>

    <span
      v-if="step.chip"
      class="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-[#ffffff] px-3 py-1.5 text-[12px] font-semibold text-[#121614] shadow-[0_1px_2px_rgba(18,22,20,0.12)]"
    >
      <span class="grid h-4 w-4 place-items-center rounded-full bg-[#0b5d3e] text-[#ffffff]">
        <i class="fa-solid fa-check text-[8px]" aria-hidden="true"></i>
      </span>
      {{ step.chip }}
    </span>
  </div>
</template>

<script setup>
import { visuals } from '~/data/explore'

defineProps({
  // one entry of exploreSteps in data/explore.js
  step: { type: Object, required: true },
})

// Tailwind needs these spelled out rather than built from the indent number.
const indents = ['', 'pl-4', 'pl-8']

const tileTones = ['bg-[#0b5d3e]', 'bg-[#b07f15]', 'bg-[#147a4c]', 'bg-[#606863]']
</script>
