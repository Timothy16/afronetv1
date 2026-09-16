<!-- app/pages/learning/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="Knowledge layer"
      title="Afronet Learning"
      description="Courses from African institutions, with AfroIntel as a tutor that works when the network does not."
    >
      <template #actions>
        <UiComingSoon />
      </template>
    </UiPageHeader>

    <UiCard class="mt-6 flex flex-wrap items-center gap-5 p-5">
      <span class="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eaf3ee] text-[#0b5d3e]">
        <i class="fa-solid fa-wand-magic-sparkles text-[18px]" aria-hidden="true"></i>
      </span>
      <div class="min-w-[14rem] flex-1">
        <h2 class="text-[15px] font-semibold text-[#121614]">AI tutor</h2>
        <p class="mt-1 text-[13px] text-[#606863]">
          Ask about anything in your courses. With the Education module installed, tutoring runs entirely on this
          device.
        </p>
      </div>
      <UiBadge tone="brand">
        <i class="fa-solid fa-link-slash text-[10px]" aria-hidden="true"></i>
        Education module installed
      </UiBadge>
      <UiButton size="sm">Start a session</UiButton>
    </UiCard>

    <section class="mt-8">
      <UiSectionHeading title="Continue learning" />
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UiCard v-for="c in courses" :key="c.id" class="flex flex-col p-5" interactive>
          <span class="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f7f7f4] text-[#606863]">
            <i class="fa-solid fa-book-open text-[14px]" aria-hidden="true"></i>
          </span>
          <h3 class="mt-3 text-[14px] font-semibold leading-snug text-[#121614]">{{ c.title }}</h3>
          <p class="mt-1 text-[12px] text-[#606863]">{{ c.provider }}</p>
          <p class="mt-1 text-[11px] text-[#8f9792]">{{ c.lessons }} lessons · {{ c.hours }}</p>
          <div class="mt-auto pt-4">
            <template v-if="c.progress > 0">
              <UiProgress :value="c.progress" />
              <p class="mt-1.5 text-[11px] text-[#8f9792]">{{ c.progress }}% complete</p>
            </template>
            <UiBadge v-else :tone="c.offline ? 'brand' : 'muted'">
              {{ c.offline ? 'Available offline' : 'Needs a gateway' }}
            </UiBadge>
          </div>
        </UiCard>
      </div>
    </section>

    <section class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <UiCard v-for="s in tracks" :key="s.title" class="p-5">
        <div class="flex items-center justify-between">
          <i class="fa-solid text-[14px] text-[#606863]" :class="s.icon" aria-hidden="true"></i>
          <UiComingSoon />
        </div>
        <h3 class="mt-3 text-[14px] font-semibold text-[#121614]">{{ s.title }}</h3>
        <p class="mt-1 text-[13px] leading-relaxed text-[#606863]">{{ s.body }}</p>
      </UiCard>
    </section>
  </div>
</template>

<script setup>
import { courses } from '~/data/knowledge'

useHead({ title: 'Learning — Afronet' })

const tracks = [
  { title: 'Universities', body: 'Accredited programmes from partner institutions.', icon: 'fa-graduation-cap' },
  { title: 'Schools', body: 'Primary and secondary curricula by country.', icon: 'fa-book-open' },
  { title: 'Skills & certification', body: 'Short, assessable, employer-recognised.', icon: 'fa-graduation-cap' },
  { title: 'Study groups', body: 'Learn together over the local mesh.', icon: 'fa-users' },
]
</script>
