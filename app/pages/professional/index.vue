<!-- app/pages/professional/index.vue -->

<template>
  <div class="mx-auto w-full max-w-5xl px-5 py-8">
    <UiPageHeader
      eyebrow="Social layer · professional"
      title="Professional profile"
      description="The working half of your African ID — verified by the institutions that issued it."
    >
      <template #actions>
        <UiButton variant="secondary" size="sm">
          <template #icon><i class="fa-solid fa-user-plus text-[12px]" aria-hidden="true"></i></template>
          Connect
        </UiButton>
        <UiButton size="sm">Message</UiButton>
      </template>
    </UiPageHeader>

    <UiCard class="mt-6 p-6">
      <div class="flex flex-wrap items-start gap-5">
        <img :src="me.avatar" :alt="me.name" class="h-20 w-20 rounded-2xl object-cover" />
        <div class="min-w-[14rem] flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-[22px] font-semibold tracking-tight text-[#121614]">{{ me.name }}</h2>
            <UiBadge tone="brand">
              <i class="fa-solid fa-shield-halved text-[10px]" aria-hidden="true"></i>
              Verified by Taraba Polytechnic
            </UiBadge>
          </div>
          <p class="mt-1 text-[14px] text-[#121614]">{{ p.headline }}</p>
          <p class="mt-1 text-[12px] text-[#606863]">{{ p.location }} · {{ me.username }}</p>
          <p class="mt-3 inline-flex rounded-full bg-[#eaf3ee] px-3 py-1 text-[12px] text-[#0b5d3e]">{{ p.open }}</p>
        </div>
      </div>

      <div class="mt-6 flex flex-wrap gap-2 border-t border-[#e4e4de] pt-5">
        <span v-for="s in p.skills" :key="s" class="rounded-full border border-[#e4e4de] px-3 py-1 text-[12px] text-[#606863]">
          {{ s }}
        </span>
      </div>
    </UiCard>

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div class="space-y-6">
        <UiCard class="p-5">
          <UiSectionHeading title="Experience" />
          <div class="mt-4 space-y-5">
            <div v-for="e in p.experience" :key="e.role" class="flex gap-4">
              <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f7f7f4] text-[#606863]">
                <i class="fa-solid fa-briefcase text-[14px]" aria-hidden="true"></i>
              </span>
              <div>
                <p class="text-[14px] font-medium text-[#121614]">{{ e.role }}</p>
                <p class="text-[12px] text-[#606863]">{{ e.org }} · {{ e.period }}</p>
                <p class="mt-1.5 text-[13px] leading-relaxed text-[#606863]">{{ e.detail }}</p>
              </div>
            </div>
          </div>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Education" />
          <div class="mt-4 space-y-4">
            <div v-for="e in p.education" :key="e.school" class="flex gap-4">
              <span class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f7f7f4] text-[#606863]">
                <i class="fa-solid fa-graduation-cap text-[14px]" aria-hidden="true"></i>
              </span>
              <div>
                <p class="text-[14px] font-medium text-[#121614]">{{ e.school }}</p>
                <p class="text-[12px] text-[#606863]">{{ e.degree }} · {{ e.period }}</p>
              </div>
            </div>
          </div>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Projects" />
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div v-for="pr in p.projects" :key="pr.name" class="rounded-xl border border-[#e4e4de] p-4">
              <p class="text-[13px] font-medium text-[#121614]">{{ pr.name }}</p>
              <p class="mt-1 text-[12px] text-[#606863]">{{ pr.detail }}</p>
            </div>
          </div>
        </UiCard>
      </div>

      <aside class="space-y-5">
        <UiCard class="p-5">
          <UiSectionHeading title="Opportunities" hint="Matched to your verified skills" />
          <div class="mt-3 space-y-3">
            <div v-for="o in p.opportunities" :key="o.role" class="rounded-xl border border-[#e4e4de] p-3">
              <p class="text-[13px] font-medium text-[#121614]">{{ o.role }}</p>
              <p class="mt-0.5 text-[12px] text-[#606863]">{{ o.org }}</p>
              <p class="mt-0.5 text-[11px] text-[#8f9792]">{{ o.location }}</p>
            </div>
          </div>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Organisations" />
          <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
            Create a verified organisation page to recruit, publish and receive payments with one African ID.
          </p>
          <UiButton variant="secondary" size="sm" class="mt-3">Create organisation</UiButton>
        </UiCard>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { professionalProfile as p } from '~/data/social'
import { me } from '~/data/people'

useHead({ title: 'Professional profile — Afronet' })
</script>
