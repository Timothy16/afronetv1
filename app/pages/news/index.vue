<!-- app/pages/news/index.vue -->

<template>
  <div class="mx-auto w-full max-w-5xl px-5 py-8">
    <UiPageHeader
      eyebrow="Knowledge layer"
      title="News"
      description="An African information layer. AI summaries are always labelled and never mixed with verified reporting."
    >
      <template #actions>
        <UiComingSoon />
      </template>
    </UiPageHeader>

    <div class="no-scrollbar mt-6 flex gap-2 overflow-x-auto border-b border-[#e4e4de] pb-3">
      <button
        v-for="s in newsSections"
        :key="s"
        class="shrink-0 rounded-full px-3 py-1.5 text-[13px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :class="section === s ? 'bg-[#eaf3ee] font-medium text-[#0b5d3e]' : 'text-[#606863] hover:text-[#121614]'"
        @click="section = s"
      >
        {{ s }}
      </button>
    </div>

    <!-- The design highlights the chosen section but lists every story regardless. -->
    <div class="mt-6 space-y-4">
      <UiCard v-for="n in newsItems" :key="n.id" class="p-5" interactive>
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-[11px] uppercase tracking-wide text-[#8f9792]">{{ n.section }}</span>
          <UiBadge v-if="n.verified" tone="brand">
            <i class="fa-solid fa-shield-halved text-[10px]" aria-hidden="true"></i>
            Verified source
          </UiBadge>
          <UiBadge v-else tone="gold">
            <i class="fa-solid fa-triangle-exclamation text-[10px]" aria-hidden="true"></i>
            Unverified
          </UiBadge>
        </div>
        <h2 class="mt-2 font-['Instrument_Serif',Georgia,serif] text-[22px] leading-tight text-[#121614]">{{ n.title }}</h2>
        <p class="mt-1.5 text-[12px] text-[#606863]">{{ n.source }} · {{ n.time }}</p>

        <div v-if="summarised.includes(n.id)" class="mt-3 rounded-xl border border-dashed border-[#e4e4de] bg-[#f7f7f4] p-3">
          <p class="flex items-center gap-1.5 text-[11px] font-medium text-[#0b5d3e]">
            <i class="fa-solid fa-wand-magic-sparkles text-[10px]" aria-hidden="true"></i>
            AfroIntel summary — generated on device, not reporting
          </p>
          <p class="mt-1.5 text-[13px] leading-relaxed text-[#121614]">{{ n.summary }}</p>
        </div>
        <button
          v-else
          class="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#e4e4de] px-3 py-1.5 text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
          @click="summarised = [...summarised, n.id]"
        >
          <i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i>
          Summarise
        </button>
      </UiCard>
    </div>
  </div>
</template>

<script setup>
import { newsItems, newsSections } from '~/data/knowledge'

useHead({ title: 'News — Afronet' })

const section = ref('Africa')
const summarised = ref([])
</script>
