<!-- app/pages/profile/index.vue -->

<template>
  <div class="mx-auto w-full max-w-5xl px-5 py-8">
    <UiPageHeader
      eyebrow="Identity layer"
      title="African ID"
      description="One identity for every Afronet service. You hold the keys; each service only sees what you allow."
    >
      <template #actions>
        <UiButton variant="secondary" size="sm">Edit profile</UiButton>
      </template>
    </UiPageHeader>

    <UiCard class="mt-6 overflow-hidden">
      <div class="flex flex-wrap items-center gap-5 border-b border-[#e4e4de] p-6">
        <img :src="me.avatar" :alt="me.name" class="h-20 w-20 rounded-2xl object-cover" />
        <div class="min-w-[12rem] flex-1">
          <div class="flex flex-wrap items-center gap-2">
            <h2 class="text-[22px] font-semibold tracking-tight text-[#121614]">{{ me.name }}</h2>
            <UiBadge tone="brand">
              <i class="fa-solid fa-shield-halved text-[10px]" aria-hidden="true"></i>
              Verified
            </UiBadge>
          </div>
          <p class="mt-1 text-[13px] text-[#606863]">{{ me.username }} · {{ me.role }}</p>
          <p class="mt-0.5 text-[12px] text-[#8f9792]">{{ me.city }}, {{ me.country }} · Member since {{ me.joined }}</p>
        </div>
        <div class="rounded-2xl border border-[#e4e4de] p-4 text-center">
          <BrandMark :size="22" class="mx-auto" />
          <p class="mt-2 text-[10px] uppercase tracking-wide text-[#8f9792]">African ID</p>
          <p class="mt-0.5 text-[13px] tracking-wide text-[#121614]">{{ me.africanId }}</p>
          <p class="mt-1 text-[10px] text-[#8f9792]">Powered by DCI</p>
        </div>
      </div>

      <div class="grid gap-6 p-6 sm:grid-cols-3">
        <div>
          <p class="text-[11px] text-[#8f9792]">Afronet trust</p>
          <p class="mt-1 text-[20px] font-semibold text-[#121614]">{{ me.trust }}/100</p>
          <UiProgress :value="me.trust" class="mt-2" />
          <p class="mt-2 text-[11px] text-[#606863]">
            Built from verified contacts, relay contribution and clean transaction history.
          </p>
        </div>
        <div>
          <p class="text-[11px] text-[#8f9792]">Public information</p>
          <ul class="mt-1.5 space-y-1 text-[13px] text-[#121614]">
            <li>Name and photo</li>
            <li>Country and city</li>
            <li>Profession</li>
          </ul>
          <button class="mt-2 text-[12px] text-[#0b5d3e] hover:underline">Change what's public</button>
        </div>
        <div>
          <p class="text-[11px] text-[#8f9792]">Sign-in</p>
          <ul class="mt-1.5 space-y-1 text-[13px] text-[#121614]">
            <li>6-digit Afronet PIN</li>
            <li>Fingerprint on this device</li>
            <li>Recovery phrase saved</li>
          </ul>
        </div>
      </div>
    </UiCard>

    <div class="mt-8 grid gap-6 lg:grid-cols-2">
      <UiCard class="p-5">
        <UiSectionHeading title="Connected services" hint="Signed in with your African ID" />
        <div class="mt-3 grid grid-cols-2 gap-2">
          <div
            v-for="a in connected"
            :key="a.id"
            class="flex items-center justify-between rounded-xl border border-[#e4e4de] px-3 py-2.5 text-[13px] text-[#121614]"
          >
            {{ a.name }}
            <span class="text-[11px] text-[#8f9792]">{{ a.phase === 'v1' ? 'Active' : 'Reserved' }}</span>
          </div>
        </div>
      </UiCard>

      <div class="space-y-6">
        <UiCard class="p-5">
          <UiSectionHeading title="Devices" hint="Where your identity is signed in" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow v-for="d in devices" :key="d.id" :label="d.name" :hint="d.last">
              <template #value>
                <UiBadge v-if="d.trusted" tone="brand">Trusted</UiBadge>
                <UiBadge v-else tone="muted">Needs review</UiBadge>
              </template>
              <template #action>
                <i
                  class="fa-solid text-[14px] text-[#8f9792]"
                  :class="d.kind === 'phone' ? 'fa-mobile-screen' : 'fa-laptop'"
                  aria-hidden="true"
                ></i>
              </template>
            </UiRow>
          </div>
          <UiButton variant="secondary" size="sm" class="mt-4">Manage sessions</UiButton>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Security & privacy" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Two-factor on new devices">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
              <template #action><i class="fa-solid fa-key text-[14px] text-[#8f9792]" aria-hidden="true"></i></template>
            </UiRow>
            <UiRow label="Contact verification" hint="4 contacts verified in person">
              <template #value><UiBadge tone="brand">Strong</UiBadge></template>
            </UiRow>
            <UiRow label="Session timeout" hint="After 30 days of inactivity">
              <template #action><i class="fa-solid fa-clock text-[14px] text-[#8f9792]" aria-hidden="true"></i></template>
            </UiRow>
            <UiRow label="AfroIntel data" hint="Conversations never leave this device">
              <template #value>
                <UiBadge tone="brand">
                  <i class="fa-solid fa-wand-magic-sparkles text-[10px]" aria-hidden="true"></i>
                  On device
                </UiBadge>
              </template>
            </UiRow>
          </div>
          <NuxtLink to="/settings" class="mt-4 inline-block text-[12px] text-[#0b5d3e] hover:underline">
            Open full privacy controls
          </NuxtLink>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { apps } from '~/data/apps'
import { me } from '~/data/people'

useHead({ title: 'African ID — Afronet' })

const devices = [
  { id: 'd1', name: 'Tecno Camon 30', kind: 'phone', last: 'Active now · Jalingo', trusted: true },
  { id: 'd2', name: 'Lenovo ThinkPad', kind: 'laptop', last: 'Yesterday · Jalingo', trusted: true },
  { id: 'd3', name: 'Campus workstation', kind: 'laptop', last: '5 days ago · Polytechnic', trusted: false },
]

const connected = apps.filter((a) => a.category !== 'System').slice(0, 10)
</script>
