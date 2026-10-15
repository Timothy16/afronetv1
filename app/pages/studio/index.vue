<!-- app/pages/studio/index.vue -->

<!--
  The Studio front page. Two versions of it: one for someone who has never built anything,
  which is mostly an invitation, and one for someone who has, which leads with the thing
  that needs them — an app waiting to be submitted, or one a reviewer sent back.

  There are no charts here. Analytics, earnings and payouts are later work, and a dashboard
  of invented numbers would be the least useful thing on the screen.
-->
<template>
  <!-- Nothing built yet --------------------------------------------------->
  <div v-if="!devApps.length">
    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[32px] leading-tight text-[#121614]">
      Welcome, {{ firstName }}.
    </h1>
    <p class="mt-1 text-[14.5px] text-[#606863]">
      You haven’t built anything yet. Your first app can be ready to try in a few minutes.
    </p>

    <section class="mt-6 grid gap-6 rounded-3xl bg-[#121614] p-6 text-[#ffffff] sm:p-8 lg:grid-cols-[1.2fr_1fr]">
      <div>
        <h2 class="font-['Instrument_Serif',Georgia,serif] text-[26px] leading-tight">
          Describe an idea. Afronet builds it.
        </h2>
        <p class="mt-2 max-w-md text-[14px] leading-relaxed text-[#ffffff]/60">
          No coding needed. Start with something you wish existed on your campus — a quiz for your course, a GPA
          tracker, a club directory.
        </p>
        <div class="mt-6 flex flex-wrap gap-2">
          <UiButton to="/studio/wizard" size="lg" variant="secondary">
            <template #icon><i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i></template>
            Build with AI
          </UiButton>
          <UiButton to="/studio/create" size="lg" variant="ghost" class="text-[#ffffff]/80 hover:bg-[#ffffff]/10 hover:text-[#ffffff]">
            Start from a template
          </UiButton>
        </div>
      </div>
      <ol class="space-y-3 text-[13.5px]">
        <li v-for="(s, i) in studioCopy.firstSteps" :key="s" class="flex items-center gap-3">
          <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#ffffff]/20 text-[12px] font-semibold">
            {{ i + 1 }}
          </span>
          {{ s }}
        </li>
      </ol>
    </section>

    <h2 class="mt-10 text-[16px] font-semibold text-[#121614]">Popular starting points</h2>
    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="t in templates.slice(0, 4)"
        :key="t.id"
        :to="`/studio/wizard?template=${t.id}`"
        class="flex items-center gap-3 rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-4 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/40"
      >
        <StoreAppIcon :icon="t.icon" tone="ink" size="sm" />
        <span>
          <span class="block text-[14px] font-semibold text-[#121614]">{{ t.name }}</span>
          <span class="block text-[12px] text-[#606863]">{{ t.description }}</span>
        </span>
      </NuxtLink>
    </div>
  </div>

  <!-- Has built something --------------------------------------------------->
  <div v-else>
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="font-['Instrument_Serif',Georgia,serif] text-[32px] leading-tight text-[#121614]">
          Welcome back, {{ firstName }}
        </h1>
        <p class="text-[14px] text-[#606863]">
          {{ published.length }} published {{ published.length === 1 ? 'app' : 'apps' }} ·
          {{ devApps.length }} in your library
        </p>
      </div>
      <UiButton to="/studio/create">
        <template #icon><i class="fa-solid fa-plus text-[11px]" aria-hidden="true"></i></template>
        Create an app
      </UiButton>
    </div>

    <dl class="mt-6 grid grid-cols-2 divide-[#e4e4de] rounded-3xl border border-[#e4e4de] bg-[#ffffff] sm:grid-cols-4 sm:divide-x">
      <div v-for="s in stats" :key="s.label" class="px-5 py-4">
        <dt class="text-[12px] text-[#606863]">{{ s.label }}</dt>
        <dd class="mt-0.5 text-[20px] font-semibold text-[#121614]">{{ s.value }}</dd>
      </div>
    </dl>

    <div class="mt-4 grid gap-4 lg:grid-cols-2">
      <section class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-[15px] font-semibold text-[#121614]">Needs you</h2>
          <NuxtLink to="/studio/apps" class="text-[12.5px] font-medium text-[#0b5d3e] hover:underline">All apps</NuxtLink>
        </div>
        <ul class="mt-3 space-y-1">
          <li v-for="a in pipeline" :key="a.id">
            <NuxtLink
              :to="a.status === 'draft' ? `/studio/builder/${a.id}` : `/studio/apps/${a.id}`"
              class="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            >
              <StoreAppIcon :icon="a.icon" :tone="a.config.tone" size="sm" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13.5px] font-medium text-[#121614]">{{ a.name }}</span>
                <span class="block truncate text-[12px] text-[#606863]">{{ nextStep(a) }}</span>
              </span>
              <StudioStatusBadge :status="a.status" />
            </NuxtLink>
          </li>
          <li v-if="!pipeline.length" class="text-[13px] text-[#606863]">Nothing in progress.</li>
        </ul>
      </section>

      <section class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <div class="flex items-center justify-between gap-3">
          <h2 class="text-[15px] font-semibold text-[#121614]">Published</h2>
          <NuxtLink to="/store" class="text-[12.5px] font-medium text-[#0b5d3e] hover:underline">See in the store</NuxtLink>
        </div>
        <ul class="mt-3 space-y-1">
          <li v-for="a in published" :key="a.id">
            <NuxtLink
              :to="`/studio/apps/${a.id}`"
              class="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            >
              <StoreAppIcon :icon="a.icon" :tone="a.config.tone" size="sm" />
              <span class="min-w-0 flex-1">
                <span class="block truncate text-[13.5px] font-medium text-[#121614]">{{ a.name }}</span>
                <span class="block text-[12px] text-[#606863]">
                  v{{ a.version }} · {{ compact(liveStats(a).installs ?? 0) }} installs · updated
                  {{ formatDate(a.updatedAt) }}
                </span>
                <span v-if="unpublishedChanges(a).length" class="mt-0.5 block text-[11.5px] text-[#b07f15]">
                  {{ unpublishedChanges(a).length }} unpublished
                  {{ unpublishedChanges(a).length === 1 ? 'change' : 'changes' }}
                </span>
              </span>
              <span
                v-if="liveStats(a).rating !== null"
                class="flex shrink-0 items-center gap-1 text-[12.5px] text-[#121614]"
              >
                <i class="fa-solid fa-star text-[10px] text-[#b07f15]" aria-hidden="true"></i>
                {{ liveStats(a).rating.toFixed(1) }}
              </span>
              <span v-else class="shrink-0 text-[12px] text-[#8f9792]">New</span>
            </NuxtLink>
          </li>
          <li v-if="!published.length" class="text-[13px] text-[#606863]">Nothing published yet.</li>
        </ul>
      </section>
    </div>

    <h2 class="mt-8 text-[16px] font-semibold text-[#121614]">Start something new</h2>
    <div class="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="t in templates.slice(0, 4)"
        :key="t.id"
        :to="`/studio/wizard?template=${t.id}`"
        class="flex items-center gap-3 rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-4 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/40"
      >
        <StoreAppIcon :icon="t.icon" tone="ink" size="sm" />
        <span>
          <span class="block text-[14px] font-semibold text-[#121614]">{{ t.name }}</span>
          <span class="block text-[12px] text-[#606863]">{{ t.description }}</span>
        </span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { compact, formatDate } from '~/data/store'
import { studioCopy, templates } from '~/data/studio'

definePageMeta({ layout: 'studio' })
useHead({ title: 'Studio · Afronet Apps' })

const { devApps, published, pipeline, liveStats, unpublishedChanges, credits, creditsLeft } = useStudio()

const { name } = useStoreUser()
const firstName = computed(() => name.value.split(' ')[0])

/**
 * Read from the listings, which is where a device reports an install. Weekly active used to
 * sit here and was always zero: nothing measures it, and an invented figure on a developer's
 * own dashboard is the least useful thing on the screen. What replaced it is a number they
 * genuinely need — how many apps they can still generate this month.
 */
const stats = computed(() => {
  const live = published.value.map((a) => liveStats(a))
  const installs = live.reduce((sum, s) => sum + (s.installs ?? 0), 0)
  const rated = live.filter((s) => s.rating !== null)
  const average = rated.length ? rated.reduce((sum, s) => sum + s.rating, 0) / rated.length : 0

  return [
    { label: 'Published apps', value: String(published.value.length) },
    { label: 'Installs (all time)', value: compact(installs) },
    { label: 'Average rating', value: average ? average.toFixed(1) : 'No ratings yet' },
    {
      label: 'Tokens left this week',
      value: `${creditsLeft.value.toLocaleString()} of ${(credits.value.allowance ?? 0).toLocaleString()}`,
    },
  ]
})

/** The one sentence that says what to do next with an app that is not finished. */
const nextStep = (app) => {
  if (app.status === 'rejected') {
    const open = app.reviewComments.filter((c) => !c.resolved).length
    return `${open} ${open === 1 ? 'comment' : 'comments'} to resolve`
  }
  if (app.status === 'in_review') return 'Waiting for a reviewer'
  if (!app.testedAt) return 'Built · needs testing'
  return 'Continue building'
}
</script>
