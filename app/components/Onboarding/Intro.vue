<!-- app/components/Onboarding/Intro.vue -->

<!--
  Screen 1 — what running the AI on your own device actually means, before an account exists.

  The source design offered to restore an encrypted backup from a previous phone. There is no
  backup system, and nothing to restore before sign-up, so this says what really happens instead.
-->
<template>
  <OnboardingShell>
    <template #header>
      <BrandMark :size="32" />
    </template>

    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614] sm:text-[30px]">
      {{ intro.title }}
    </h1>
    <p class="mt-2.5 text-[15px] leading-relaxed text-[#606863]">{{ intro.body }}</p>

    <ul class="mt-7 divide-y divide-[#e4e4de] overflow-hidden rounded-2xl border border-[#e4e4de]">
      <li v-for="point in intro.points" :key="point.id" class="flex gap-3.5 p-4 sm:p-5">
        <span class="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf3ee] text-[#0b5d3e]">
          <i class="fa-solid text-[14px]" :class="point.icon" aria-hidden="true"></i>
        </span>
        <span class="min-w-0">
          <span class="block text-[15px] font-medium text-[#121614]">{{ point.title }}</span>
          <span class="mt-1 block text-[13px] leading-relaxed text-[#606863]">{{ point.detail }}</span>
        </span>
      </li>
    </ul>

    <template #footer>
      <UiButton block size="lg" @click="$emit('done')">{{ intro.action }}</UiButton>
    </template>
  </OnboardingShell>
</template>

<script setup>
import { intro } from '~/data/onboarding'

defineEmits(['done'])
</script>
