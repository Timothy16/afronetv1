<!-- app/pages/explore/index.vue -->

<!--
  "Explore what Afronet can do" — thirteen steps, one at a time, at every
  screen size. Stacked on a phone with swipe; visual beside text from `lg`,
  where Next and Skip stay in reach rather than making anyone scroll through
  thirteen screens.

  The first three steps are what Afronet does for a student today; the ten
  after them are the wider product story, five of which are not built yet and
  are labelled as previews.
-->
<template>
  <div class="flex min-h-[100dvh] flex-col bg-[#f7f7f4]">
    <header class="flex items-center justify-between gap-4 px-5 pt-5 sm:px-8">
      <BrandLogo aria-label="Back to the Afronet landing page" />
      <UiButton to="/welcome" variant="ghost" size="sm">Skip</UiButton>
    </header>

    <!-- Thirteen segments, each a way back to a step already seen -->
    <div class="mt-5 flex gap-1 px-5 sm:px-8" role="tablist" aria-label="Afronet capabilities">
      <button
        v-for="(step, i) in exploreSteps"
        :key="step.id"
        role="tab"
        :aria-selected="i === index"
        :aria-label="step.title"
        class="h-1.5 flex-1 rounded-full bg-[#e4e4de]"
        @click="goTo(i)"
      >
        <span
          class="block h-full rounded-full transition-colors duration-200"
          :class="i <= index ? 'bg-[#121614]' : 'bg-transparent'"
        ></span>
      </button>
    </div>

    <main class="flex min-h-0 flex-1 flex-col">
      <!-- Scrollable content area — stops above the sticky button bar -->
      <div class="min-h-0 flex-1 overflow-y-auto pb-32">
        <div
          class="mx-auto grid w-full max-w-6xl gap-6 px-5 pt-6 sm:px-8 lg:grid-cols-2 lg:items-center lg:gap-14 lg:pt-10"
        >
          <!-- Swipe only matters where there is no keyboard; the buttons below
               do the same job and are the accessible path. -->
          <div
            class="h-[46vh] min-h-[220px] touch-pan-y select-none lg:h-[68vh] lg:min-h-[420px]"
            @pointerdown="onDown"
            @pointerup="onUp"
          >
            <ExploreVisual :key="current.id" :step="current" />
          </div>

          <article :key="`${current.id}-text`" class="rise pb-2">
            <div class="flex flex-wrap items-center gap-2">
              <span class="inline-flex items-center gap-2 text-sm font-semibold text-[#606863]">
                <i class="fa-solid text-[13px]" :class="current.icon" aria-hidden="true"></i>
                {{ current.title }}
              </span>
              <ExploreBadge :status="current.status" />
            </div>

            <h1
              class="mt-3 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-[1.08] tracking-tight text-[#121614] sm:text-[38px] lg:text-[44px]"
            >
              {{ current.headline }}
            </h1>
            <p class="mt-3 max-w-xl text-[15px] leading-relaxed text-[#606863] sm:text-base">{{ current.body }}</p>
          </article>
        </div>
      </div>

      <!-- Sticky button bar — always visible at the bottom, text scrolls behind it -->
      <div class="sticky bottom-0 z-10 border-t border-[#e4e4de] bg-[#f7f7f4]/95 backdrop-blur-sm">
        <div class="mx-auto w-full max-w-6xl px-5 pb-7 pt-4 sm:px-8">
          <div v-if="isLast" class="flex flex-col gap-2.5 sm:max-w-sm">
            <UiButton to="/welcome" block size="lg">
              Get Started
              <i class="fa-solid fa-arrow-right text-[13px]" aria-hidden="true"></i>
            </UiButton>
            <UiButton to="/welcome?mode=signin" block size="lg" variant="secondary">Sign in</UiButton>
          </div>

          <div v-else class="flex items-center gap-3 sm:max-w-md">
            <UiButton
              variant="secondary"
              size="lg"
              aria-label="Previous"
              class="w-12 shrink-0 px-0"
              :disabled="index === 0"
              @click="go(-1)"
            >
              <i class="fa-solid fa-arrow-left text-[14px]" aria-hidden="true"></i>
            </UiButton>
            <UiButton size="lg" class="flex-1" @click="go(1)">
              Next
              <i class="fa-solid fa-arrow-right text-[13px]" aria-hidden="true"></i>
            </UiButton>
          </div>

          <p class="mt-3 text-[12px] text-[#8f9792]">
            {{ index + 1 }} of {{ exploreSteps.length }}
            <span class="lg:hidden"> · Swipe to explore</span>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { clampStep, exploreSteps } from '~/data/explore'

definePageMeta({ layout: 'blank' })

const route = useRoute()

const index = ref(clampStep(route.query.start ?? 0))

const current = computed(() => exploreSteps[index.value])
const isLast = computed(() => index.value === exploreSteps.length - 1)

useHead({ title: () => `${current.value.title} · Explore Afronet` })

const goTo = (next) => {
  index.value = clampStep(next)
  if (import.meta.client) window.scrollTo({ top: 0 })
}

const go = (delta) => goTo(index.value + delta)

// Swipe, without a gesture library: remember where the pointer went down and
// compare on the way up.
let startX = null

const onDown = (event) => {
  startX = event.clientX
}

const onUp = (event) => {
  if (startX === null) return
  const travelled = event.clientX - startX
  startX = null
  if (travelled < -60) go(1)
  else if (travelled > 60) go(-1)
}
</script>

<style scoped>
/* Defined here rather than globally, as the other pages in this port do. */
.rise {
  animation: rise 0.28s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes rise {
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
  .rise {
    animation: none;
  }
}
</style>
