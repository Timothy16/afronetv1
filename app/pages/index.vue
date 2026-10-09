<!-- app/pages/index.vue -->

<!--
  The public landing page. Outside the app shell, so it carries its own header
  and footer, and it is the first thing a stranger sees — the app home now
  lives at /home.

  The position is deliberately campus-first: students, then the institutions
  that host them, then the wider community. Every claim about offline use
  travels with a badge saying what it actually needs, because AFRONET does not
  provide free internet and saying otherwise would be a lie people make
  decisions on.
-->
<template>
  <div class="min-h-[100dvh] bg-[#f7f7f4]">
    <!--
      Floats over the photographic hero and turns solid once you scroll past
      it. A white bar sitting above a full-bleed dark hero reads as a mistake,
      but a long marketing page still wants its nav within reach.
    -->
    <header
      class="fixed top-0 z-40 w-full transition-colors duration-200"
      :class="scrolled ? 'border-b border-[#e4e4de] bg-[#ffffff]/90 backdrop-blur' : 'bg-transparent'"
    >
      <div class="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <BrandLogo :class="scrolled ? '' : 'text-[#ffffff]'" />
        <nav
          class="hidden items-center gap-7 text-sm md:flex"
          :class="scrolled ? 'text-[#606863]' : 'text-[#ffffff]/85'"
          aria-label="Landing"
        >
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="transition-colors duration-150"
            :class="scrolled ? 'hover:text-[#121614]' : 'hover:text-[#ffffff]'"
          >
            {{ link.label }}
          </a>
        </nav>
        <div class="flex items-center gap-2">
          <!-- Hidden below sm: three controls crowd a 360px screen, and Get Started leads to
               the same page, where signing in is one tap away. -->
          <NuxtLink
            to="/welcome?mode=signin"
            class="hidden h-8 items-center rounded-lg px-3 text-[13px] font-medium transition-colors duration-150 sm:inline-flex"
            :class="scrolled ? 'text-[#606863] hover:bg-[#f7f7f4] hover:text-[#121614]' : 'text-[#ffffff]/85 hover:bg-[#ffffff]/10 hover:text-[#ffffff]'"
          >
            Sign in
          </NuxtLink>
          <UiButton to="/welcome?mode=create" size="sm">Get Started</UiButton>
        </div>
      </div>
    </header>

    <LandingHero />

    <!-- Connect once -->
    <LandingSection padded>
      <div class="rounded-[28px] bg-[#121614] p-6 text-[#ffffff] sm:p-9">
        <div class="lg:grid lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <div class="max-w-xl">
            <h2 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight tracking-tight sm:text-[34px]">
              {{ offlinePanel.title }}
            </h2>
            <p class="mt-4 text-sm leading-relaxed text-[#ffffff]/70">{{ offlinePanel.body }}</p>
          </div>

          <ul class="mt-7 divide-y divide-[#ffffff]/10 border-t border-[#ffffff]/10 lg:mt-0 lg:border-t-0">
            <li v-for="row in offlinePanel.rows" :key="row.title" class="flex gap-4 py-4 first:lg:pt-0">
              <i class="fa-solid mt-0.5 shrink-0 text-[17px] text-[#eaf3ee]" :class="row.icon" aria-hidden="true"></i>
              <div>
                <p class="font-semibold">{{ row.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-[#ffffff]/65">{{ row.description }}</p>
                <div v-if="row.status" class="mt-2.5">
                  <LandingBadge :status="row.status" on-dark />
                </div>
              </div>
            </li>
          </ul>
        </div>
        <p class="mt-6 border-t border-[#ffffff]/10 pt-5 text-[12px] leading-relaxed text-[#ffffff]/55">
          {{ offlinePanel.footnote }}
        </p>
      </div>
    </LandingSection>

    <!-- About -->
    <LandingSection id="about" eyebrow="About Afronet" title="An African Digital Network, powered by African Intelligence.">
      <template #lead>Useful digital tools for students — without depending entirely on expensive internet access.</template>

      <!-- Two across at tablet widths rather than three: these cards carry
           three bullets and a badge each, and 240px columns crush them. -->
      <div class="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <LandingBenefitCard
          v-for="(benefit, i) in benefits"
          :key="benefit.id"
          :benefit="benefit"
          :dark="i === 0"
        />
      </div>

      <NuxtLink
        to="/explore"
        class="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#0b5d3e] transition-colors duration-150 hover:text-[#121614]"
      >
        Walk through all 13 in detail
        <i class="fa-solid fa-arrow-right text-[12px]" aria-hidden="true"></i>
      </NuxtLink>
    </LandingSection>

    <!-- How it works -->
    <LandingSection eyebrow="How it works" title="Set up online. Keep going offline.">
      <div class="mt-9 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ol>
          <li v-for="(step, i) in setupSteps" :key="step.title" class="relative flex gap-4 pb-8 last:pb-0">
            <span
              v-if="i < setupSteps.length - 1"
              class="absolute left-[18px] top-10 h-[calc(100%-40px)] w-px bg-[#e4e4de]"
              aria-hidden="true"
            ></span>
            <span
              class="grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-semibold"
              :class="step.online ? 'bg-[#f7f7f4] text-[#0b5d3e] ring-1 ring-[#e4e4de]' : 'bg-[#0b5d3e] text-[#ffffff]'"
            >
              {{ i + 1 }}
            </span>
            <div class="pt-1">
              <h3 class="font-semibold text-[#121614]">{{ step.title }}</h3>
              <p class="mt-1 text-sm leading-relaxed text-[#606863]">{{ step.description }}</p>
              <p class="mt-2 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#606863]">
                <i class="fa-solid text-[11px]" :class="step.icon" aria-hidden="true"></i>
                {{ step.requirement }}
              </p>
            </div>
          </li>
        </ol>

        <LandingComparison />
      </div>
    </LandingSection>

    <!-- Devices -->
    <LandingSection eyebrow="Works across your devices" title="Your phone, tablet or laptop.">
      <ul class="mt-8 grid gap-x-10 border-y border-[#e4e4de] sm:grid-cols-2">
        <li
          v-for="device in devices"
          :key="device.name"
          class="flex items-center justify-between gap-3 border-b border-[#e4e4de] py-3.5 last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
        >
          <span class="flex items-center gap-3 text-[15px] font-medium text-[#121614]">
            <i class="fa-solid w-5 text-center text-[15px] text-[#0b5d3e]" :class="device.icon" aria-hidden="true"></i>
            {{ device.name }}
          </span>
          <span class="text-right text-[12px] text-[#606863]">{{ device.note }}</span>
        </li>
      </ul>
      <p class="mt-4 flex gap-2 text-[12px] leading-relaxed text-[#606863]">
        <i class="fa-solid fa-circle-info mt-0.5 shrink-0 text-[11px]" aria-hidden="true"></i>
        {{ deviceCaveat }}
      </p>
    </LandingSection>

    <!-- African Intelligence -->
    <LandingSection id="intelligence" :eyebrow="intelligence.eyebrow" :title="intelligence.title">
      <template #lead>{{ intelligence.body }}</template>

      <div class="mt-9 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
        <div>
          <h3 class="text-sm font-semibold text-[#121614]">Specialised intelligences</h3>
          <ul class="mt-4 grid grid-cols-2 gap-3">
            <li
              v-for="item in specialisedIntelligences"
              :key="item.name"
              class="flex flex-col rounded-[20px] bg-[#ffffff] p-4 ring-1 ring-[#e4e4de]"
            >
              <i class="fa-solid text-[17px] text-[#0b5d3e]" :class="item.icon" aria-hidden="true"></i>
              <p class="mt-3 font-semibold text-[#121614]">{{ item.name }}</p>
              <p class="mt-1 text-[12px] leading-relaxed text-[#606863]">{{ item.description }}</p>
            </li>
          </ul>
          <div class="mt-4">
            <LandingBadge status="devices" />
            <p class="mt-2 text-[12px] leading-relaxed text-[#606863]">{{ intelligence.note }}</p>
          </div>
        </div>

        <section class="rounded-[24px] bg-[#ffffff] p-6 ring-1 ring-[#e4e4de]" aria-labelledby="language-roadmap">
          <h3
            id="language-roadmap"
            class="font-['Instrument_Serif',Georgia,serif] text-[22px] leading-tight tracking-tight text-[#121614]"
          >
            Language roadmap
          </h3>
          <p class="mt-1.5 text-sm text-[#606863]">{{ languageNote }}</p>
          <ol class="mt-6">
            <li v-for="(phase, i) in languagePhases" :key="phase.title" class="relative flex gap-4 pb-7 last:pb-0">
              <span
                v-if="i < languagePhases.length - 1"
                class="absolute left-[11px] top-7 h-[calc(100%-28px)]"
                :class="phase.status === 'available' ? 'w-px bg-[#0b5d3e]' : 'border-l border-dashed border-[#8f9792]/50'"
                aria-hidden="true"
              ></span>
              <span
                class="mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full"
                :class="
                  phase.status === 'available'
                    ? 'bg-[#0b5d3e] ring-4 ring-[#eaf3ee]'
                    : 'border-2 border-dashed border-[#8f9792]/60 bg-[#f7f7f4]'
                "
                aria-hidden="true"
              ></span>
              <div>
                <p class="text-[12px] font-semibold text-[#606863]">{{ phase.phase }}</p>
                <p class="mt-0.5 font-semibold text-[#121614]">{{ phase.title }}</p>
                <p class="mt-1 text-sm leading-relaxed text-[#606863]">{{ phase.description }}</p>
                <div class="mt-2.5">
                  <LandingBadge :status="phase.status" />
                </div>
              </div>
            </li>
          </ol>
        </section>
      </div>
    </LandingSection>

    <!-- For campuses -->
    <LandingSection id="campuses" :eyebrow="campus.eyebrow" :title="campus.title">
      <div class="mt-9 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-14">
        <div>
          <img
            :src="images.campus"
            :alt="campus.imageAlt"
            class="aspect-[3/2] w-full rounded-[24px] object-cover"
            loading="lazy"
            width="1200"
            height="800"
          />
          <ul class="mt-6 space-y-3">
            <li v-for="point in campus.points" :key="point" class="flex gap-3 text-[15px] text-[#121614]">
              <i class="fa-solid fa-check mt-1 shrink-0 text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
              {{ point }}
            </li>
          </ul>
        </div>

        <!-- No verified partners yet, so the page asks for the first ones
             rather than showing invented logos. -->
        <div v-if="!campuses.length" class="rounded-[24px] bg-[#121614] p-6 text-[#ffffff] sm:p-8">
          <h3 class="font-['Instrument_Serif',Georgia,serif] text-[26px] leading-tight tracking-tight">
            {{ foundingPartner.title }}
          </h3>
          <p class="mt-3 text-sm leading-relaxed text-[#ffffff]/70">{{ foundingPartner.body }}</p>
          <ul class="mt-5 space-y-3">
            <li v-for="point in foundingPartner.points" :key="point" class="flex gap-2.5 text-sm text-[#ffffff]/90">
              <i class="fa-solid fa-check mt-1 shrink-0 text-[11px] text-[#eaf3ee]" aria-hidden="true"></i>
              {{ point }}
            </li>
          </ul>
          <UiButton href="#partner" block size="lg" class="mt-7">
            Partner with Afronet
            <i class="fa-solid fa-arrow-right text-[13px]" aria-hidden="true"></i>
          </UiButton>
        </div>
      </div>

      <div class="mt-14">
        <h3 class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b5d3e]">For schools &amp; universities</h3>
        <h4
          class="mt-2.5 max-w-2xl font-['Instrument_Serif',Georgia,serif] text-[26px] leading-tight tracking-tight text-[#121614] sm:text-[32px]"
        >
          Why institutions are exploring Afronet.
        </h4>
        <ul class="mt-7 grid gap-x-10 border-y border-[#e4e4de] lg:grid-cols-2">
          <li
            v-for="highlight in institutionHighlights"
            :key="highlight.title"
            class="flex gap-4 border-b border-[#e4e4de] py-4 last:border-b-0"
          >
            <span class="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eaf3ee] text-[#0b5d3e]">
              <i class="fa-solid text-[14px]" :class="highlight.icon" aria-hidden="true"></i>
            </span>
            <div>
              <h5 class="text-[15px] font-semibold text-[#121614]">{{ highlight.title }}</h5>
              <p class="mt-0.5 text-sm leading-relaxed text-[#606863]">{{ highlight.description }}</p>
            </div>
          </li>
        </ul>
        <p class="mt-4 text-[12px] leading-relaxed text-[#606863]">{{ institutionCaveat }}</p>
      </div>
    </LandingSection>

    <!-- Roadmap -->
    <LandingSection id="roadmap" :eyebrow="roadmap.eyebrow" :title="roadmap.title">
      <template #lead>{{ roadmap.body }}</template>

      <ul class="mt-9 grid gap-x-10 border-y border-[#e4e4de] lg:grid-cols-2">
        <li
          v-for="item in roadmapItems"
          :key="item.title"
          class="flex gap-4 border-b border-[#e4e4de] py-4 last:border-b-0"
        >
          <i class="fa-solid mt-1 w-5 shrink-0 text-center text-[15px] text-[#8f9792]" :class="item.icon" aria-hidden="true"></i>
          <div>
            <h3 class="text-[15px] font-semibold text-[#121614]">{{ item.title }}</h3>
            <p class="mt-0.5 text-sm leading-relaxed text-[#606863]">{{ item.description }}</p>
            <div class="mt-2.5">
              <LandingBadge status="soon" />
            </div>
          </div>
        </li>
      </ul>
    </LandingSection>

    <!-- Partner form -->
    <LandingSection id="partner" eyebrow="Campus partnerships" title="Bring Afronet to your institution.">
      <div class="mt-9 max-w-2xl">
        <LandingPartnerForm />
      </div>
    </LandingSection>

    <!-- Final CTA -->
    <section class="border-t border-[#e4e4de] bg-[#ffffff]">
      <div class="mx-auto w-full max-w-6xl px-5 py-16 text-center sm:px-8 sm:py-24">
        <h2
          class="mx-auto max-w-2xl font-['Instrument_Serif',Georgia,serif] text-[32px] leading-[1.1] tracking-tight text-[#121614] sm:text-[42px]"
        >
          {{ finalCta.title }}
        </h2>
        <p class="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[#606863]">{{ finalCta.body }}</p>
        <div class="mx-auto mt-8 flex max-w-sm flex-col gap-2.5 sm:max-w-none sm:flex-row sm:justify-center">
          <UiButton to="/welcome?mode=create" size="lg" class="sm:min-w-[200px]">
            Get Started
            <i class="fa-solid fa-arrow-right text-[13px]" aria-hidden="true"></i>
          </UiButton>
          <UiButton href="#partner" size="lg" variant="secondary" class="sm:min-w-[200px]">
            Partner with Afronet
          </UiButton>
        </div>
      </div>
    </section>

    <footer class="border-t border-[#e4e4de] bg-[#f7f7f4]">
      <div
        class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-5 py-8 text-[12px] text-[#8f9792] sm:flex-row sm:items-center sm:justify-between sm:px-8"
      >
        <BrandLogo />
        <p>© 2026 Afronet · Africa’s Digital Network</p>
        <NuxtLink to="/explore" class="font-semibold text-[#606863] transition-colors duration-150 hover:text-[#121614]">
          Explore what Afronet can do
        </NuxtLink>
      </div>
    </footer>
  </div>
</template>

<script setup>
import {
  benefits,
  campus,
  campuses,
  deviceCaveat,
  devices,
  finalCta,
  foundingPartner,
  images,
  institutionCaveat,
  institutionHighlights,
  intelligence,
  languageNote,
  languagePhases,
  offlinePanel,
  roadmap,
  roadmapItems,
  setupSteps,
  specialisedIntelligences,
} from '~/data/landing'

definePageMeta({ layout: 'blank' })

useHead({
  title: 'Afronet · Your digital world, even without the internet',
  meta: [
    {
      name: 'description',
      content:
        'Afronet brings personalised AI, student communication and digital services together in one network designed for campuses and communities across Africa.',
    },
  ],
})

const navLinks = [
  { label: 'About', href: '#about' },
  { label: 'African Intelligence', href: '#intelligence' },
  { label: 'For campuses', href: '#campuses' },
  { label: 'Roadmap', href: '#roadmap' },
]

// False on the server and on first paint, which is correct — the page opens at
// the top of the hero, where the header is meant to be transparent.
const scrolled = ref(false)

const onScroll = () => {
  scrolled.value = window.scrollY > 24
}

onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  if (import.meta.client) window.removeEventListener('scroll', onScroll)
})
</script>
