<!-- app/components/Landing/Hero.vue -->

<!--
  Full-bleed photographic hero: the image fills the section, a dark wash keeps
  the type legible over it, and everything sits at the bottom so the
  photograph reads first and the words land on top of it.

  The page header floats over this transparently, which is why there is no
  logo in here — it would be the second one on screen.

  Stacks full-width on a phone and goes inline from `sm`, with the copy held
  to a readable measure rather than stretching across a desktop.
-->
<template>
  <section class="relative isolate flex min-h-[100svh] flex-col overflow-hidden bg-[#121614] text-[#ffffff] md:min-h-[88vh]">
    <img
      :src="images.hero"
      :alt="hero.imageAlt"
      class="absolute inset-0 -z-10 h-full w-full object-cover object-[50%_35%]"
      width="1200"
      height="900"
    />
    <!-- A flat wash for overall contrast, plus a heavier gradient at the
         bottom where the text actually sits. -->
    <div class="absolute inset-0 -z-10 bg-[#121614]/55" aria-hidden="true"></div>
    <div
      class="absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-gradient-to-t from-[#121614] via-[#121614]/70 to-transparent"
      aria-hidden="true"
    ></div>

    <div class="mx-auto mt-auto w-full max-w-6xl px-5 pb-10 pt-24 sm:px-8 sm:pb-16 sm:pt-28">
      <span
        class="inline-flex items-center gap-2 rounded-full bg-[#ffffff]/10 py-1 pl-1 pr-3 text-[11px] font-semibold text-[#ffffff] ring-1 ring-inset ring-[#ffffff]/20 backdrop-blur sm:py-1.5 sm:pl-1.5 sm:pr-3.5 sm:text-[12px]"
      >
        <span class="grid h-5 w-5 place-items-center rounded-full bg-[#0b5d3e] sm:h-6 sm:w-6">
          <i class="fa-solid fa-brain text-[10px] sm:text-[11px]" aria-hidden="true"></i>
        </span>
        {{ hero.chip }}
      </span>

      <p class="mt-5 text-[12px] font-semibold uppercase tracking-[0.18em] text-[#ffffff]/70 sm:mt-7 sm:text-[13px]">Afronet</p>

      <h1
        class="mt-2 max-w-3xl font-['Instrument_Serif',Georgia,serif] text-[34px] leading-[1.04] tracking-tight sm:mt-2.5 sm:text-[56px] sm:leading-[1.02] lg:text-[68px]"
      >
        {{ hero.titleLead }}
        <span class="italic text-[#eaf3ee]">{{ hero.titleAccent }}</span>
      </h1>

      <p class="mt-4 max-w-xl text-[14px] leading-relaxed text-[#ffffff]/85 sm:mt-5 sm:text-[17px]">{{ hero.body }}</p>

      <div class="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row">
        <UiButton :to="createHref" size="lg" block class="sm:w-auto sm:min-w-[200px]">
          Get Started
          <i class="fa-solid fa-arrow-right text-[13px]" aria-hidden="true"></i>
        </UiButton>
        <!-- Written out rather than UiButton with an override: passing a
             `bg-` class to a variant that already sets one leaves the winner
             up to stylesheet order. Geometry matches UiButton size="lg". -->
        <NuxtLink
          :to="signinHref"
          class="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-[#ffffff]/45 px-6 text-[15px] font-medium text-[#ffffff] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#ffffff]/10 sm:min-w-[160px]"
        >
          Sign in
        </NuxtLink>
      </div>

      <NuxtLink
        to="/explore"
        class="mt-5 inline-flex items-center gap-2 text-[13px] font-semibold text-[#ffffff]/90 transition-colors duration-150 hover:text-[#ffffff] sm:mt-7 sm:text-sm"
      >
        Explore what Afronet can do
        <i class="fa-solid fa-arrow-right text-[12px]" aria-hidden="true"></i>
      </NuxtLink>
    </div>
  </section>
</template>

<script setup>
import { hero, images } from '~/data/landing'

defineProps({
  createHref: { type: String, default: '/welcome?mode=create' },
  signinHref: { type: String, default: '/welcome?mode=signin' },
})
</script>
