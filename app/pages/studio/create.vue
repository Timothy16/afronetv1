<!-- app/pages/studio/create.vue -->

<!--
  How to start: describe it, or begin from a template.

  Importing an existing web project is shown and disabled on purpose rather than hidden.
  It is a real plan, and it is blocked on a real thing — an import validator that can prove
  someone else's code obeys the runtime's sandbox rules — so saying that is more useful than
  leaving a gap where a developer expects the option to be.
-->
<template>
  <div>
    <UiPageHeader title="Create an app" description="Pick how you want to start. You can change everything afterwards." />

    <div class="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <NuxtLink
        to="/studio/wizard"
        class="flex flex-col rounded-3xl bg-[#121614] p-7 text-left text-[#ffffff] transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-95"
      >
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0b5d3e]">
          <i class="fa-solid fa-wand-magic-sparkles text-[20px]" aria-hidden="true"></i>
        </span>
        <span class="mt-6 font-['Instrument_Serif',Georgia,serif] text-[26px] leading-tight">Build with AI</span>
        <span class="mt-2 max-w-md text-[14px] leading-relaxed text-[#ffffff]/60">
          Describe the app in your own words. Afronet asks a few questions, builds a first version, and you refine it
          by describing changes.
        </span>
        <span class="mt-8 flex flex-wrap items-center justify-between gap-3">
          <span class="text-[12.5px] text-[#ffffff]/50">
            {{ creditsLeft }} of {{ credits.limit }} generations left this month · demo quota
          </span>
          <span class="inline-flex items-center gap-1.5 rounded-xl bg-[#ffffff] px-4 py-2 text-[13.5px] font-medium text-[#121614]">
            Start
            <i class="fa-solid fa-arrow-right text-[11px]" aria-hidden="true"></i>
          </span>
        </span>
      </NuxtLink>

      <div class="flex flex-col rounded-3xl border border-dashed border-[#e4e4de] bg-[#ffffff] p-7">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7f7f4] text-[#606863]">
          <i class="fa-solid fa-file-code text-[20px]" aria-hidden="true"></i>
        </span>
        <span class="mt-6 flex flex-wrap items-center gap-2 text-[18px] font-semibold text-[#121614]">
          Import a web project
          <UiBadge tone="outline">Future</UiBadge>
        </span>
        <span class="mt-2 text-[13.5px] leading-relaxed text-[#606863]">
          Bring a static HTML, CSS and JavaScript project. Needs an import validator that can check someone else’s
          code against the runtime’s sandbox rules — not in this release.
        </span>
        <UiButton variant="secondary" disabled class="mt-auto self-start">Not available yet</UiButton>
      </div>
    </div>

    <h2 class="mt-10 text-[17px] font-semibold tracking-tight text-[#121614]">Start from a template</h2>
    <p class="text-[13.5px] text-[#606863]">
      Templates are tested starting points. Each one fills in the first answers for you, and you can change any of
      them.
    </p>
    <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <NuxtLink
        v-for="t in templates"
        :key="t.id"
        :to="`/studio/wizard?template=${t.id}`"
        class="flex flex-col rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-4 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/40"
      >
        <StoreAppIcon :icon="t.icon" tone="ink" size="sm" />
        <span class="mt-3 text-[14px] font-semibold text-[#121614]">{{ t.name }}</span>
        <span class="mt-0.5 text-[12.5px] leading-relaxed text-[#606863]">{{ t.description }}</span>
        <span class="mt-auto pt-3 text-[11.5px] text-[#8f9792]">{{ findCategory(t.category)?.name }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { findCategory } from '~/data/store'
import { templates } from '~/data/studio'

definePageMeta({ layout: 'studio' })
useHead({ title: 'Create an app · Afronet Studio' })

const { credits, creditsLeft } = useStudio()
</script>
