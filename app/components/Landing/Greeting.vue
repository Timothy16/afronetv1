<!-- app/components/Landing/Greeting.vue -->

<!--
  The dark greeting panel that opens onboarding: a greeting that changes
  language every couple of seconds, what the Intelligence offers, and a
  waveform standing in for voice.

  The first greeting renders on the server and the cycling only starts after
  mount, so there is nothing for hydration to disagree about.
-->
<template>
  <div class="relative overflow-hidden bg-[#121614] px-5 py-7 text-[#ffffff] sm:px-8 sm:py-10">
    <svg class="pointer-events-none absolute inset-0 h-full w-full text-[#ffffff] opacity-[0.06]" aria-hidden="true">
      <defs>
        <pattern :id="patternId" width="32" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 12 8 4l8 8 8-8 8 8" fill="none" stroke="currentColor" stroke-width="1" />
          <path d="M0 24 8 16l8 8 8-8 8 8" fill="none" stroke="currentColor" stroke-width="1" />
          <circle cx="16" cy="2" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" :fill="`url(#${patternId})`" />
    </svg>

    <NuxtLink to="/" aria-label="Afronet home" class="relative inline-flex items-center gap-2.5">
      <BrandMark :size="32" />
      <span class="text-[12px] font-semibold tracking-[0.3em]">AFRONET</span>
    </NuxtLink>

    <div class="relative mt-7 sm:mt-12">
      <div class="min-h-[58px] sm:min-h-[64px]">
        <p
          :key="current.text"
          class="greet font-['Instrument_Serif',Georgia,serif] text-[26px] leading-none sm:text-[34px]"
        >
          {{ current.text }}
        </p>
        <p :key="`${current.text}-lang`" class="greet mt-2 text-[12px] text-[#ffffff]/60">{{ current.lang }}</p>
      </div>

      <p class="mt-6 max-w-[280px] rounded-3xl rounded-tl-md bg-[#ffffff]/10 px-4 py-3 text-[14px] leading-relaxed text-[#ffffff]/90 sm:mt-8 sm:text-[15px]">
        {{ assistantLine }}
      </p>

      <div class="mt-4 flex items-end gap-[3px] sm:mt-5" aria-hidden="true">
        <span
          v-for="(height, i) in waveform"
          :key="i"
          class="w-[3px] rounded-full bg-[#eaf3ee]"
          :style="{ height: `${height}px` }"
        ></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { assistantLine, greetings, waveform } from '~/data/welcome'

const patternId = useId()
const index = ref(0)
let timer

const current = computed(() => greetings[index.value])

onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % greetings.length
  }, 2200)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<style scoped>
.greet {
  animation: greet-in 0.22s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes greet-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .greet {
    animation: none;
  }
}
</style>
