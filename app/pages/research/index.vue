<!-- app/pages/research/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="Knowledge layer"
      title="Afronet Research"
      description="Search, read and summarise African research — with your reference library cached on device."
    >
      <template #actions>
        <UiComingSoon label="With MySchool Research" />
      </template>
    </UiPageHeader>

    <div class="relative mt-6">
      <i
        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
        aria-hidden="true"
      ></i>
      <UiInput v-model="q" size="lg" placeholder="Search papers, authors, institutions" class="pl-10" />
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div>
        <UiSectionHeading title="Results" hint="41 papers available offline on this device" />
        <div class="mt-4 space-y-3">
          <UiCard v-for="p in papers" :key="p.id" class="p-5" interactive>
            <div class="flex items-start justify-between gap-4">
              <div class="min-w-0">
                <h3 class="text-[15px] font-semibold leading-snug text-[#121614]">{{ p.title }}</h3>
                <p class="mt-1 text-[12px] text-[#606863]">{{ p.authors }}</p>
                <p class="mt-0.5 text-[11px] text-[#8f9792]">{{ p.venue }}</p>
              </div>
              <UiBadge :tone="p.saved ? 'brand' : 'outline'">
                <i class="fa-solid fa-bookmark text-[10px]" aria-hidden="true"></i>
                {{ p.saved ? 'Saved' : 'Save' }}
              </UiBadge>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <UiButton size="sm" variant="secondary">
                <template #icon><i class="fa-solid fa-file-lines text-[12px]" aria-hidden="true"></i></template>
                Read
              </UiButton>
              <UiButton size="sm" variant="ghost">
                <template #icon><i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i></template>
                Summarise with AfroIntel
              </UiButton>
            </div>
          </UiCard>
        </div>
      </div>

      <aside class="space-y-5">
        <UiCard class="p-5">
          <UiSectionHeading title="Projects" />
          <div class="mt-3 space-y-2">
            <div v-for="p in projects" :key="p" class="flex items-center gap-2.5 text-[13px] text-[#121614]">
              <i class="fa-solid fa-folder text-[14px] text-[#606863]" aria-hidden="true"></i>
              {{ p }}
            </div>
          </div>
          <UiButton size="sm" variant="secondary" class="mt-4">New project</UiButton>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Collaborators" />
          <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
            Share references and drafts device to device. Everything merges when a gateway is reached.
          </p>
          <p class="mt-3 flex items-center gap-2 text-[12px] text-[#8f9792]">
            <i class="fa-solid fa-users text-[12px]" aria-hidden="true"></i>
            3 collaborators · 2 reachable now
          </p>
        </UiCard>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { papers } from '~/data/knowledge'

useHead({ title: 'Research — Afronet' })

const q = ref('delay-tolerant networking')

const projects = ['Jalingo mesh survey', 'Edge inference benchmark', 'Clinic data quality']
</script>
