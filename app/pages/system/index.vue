<!-- app/pages/system/index.vue -->

<!-- The design system reference page: every building block, on one screen. -->
<template>
  <div class="mx-auto w-full max-w-5xl px-5 py-8">
    <UiPageHeader
      eyebrow="Foundation"
      title="Afronet design system"
      description="One ecosystem, not twenty apps. Every surface is built from these pieces."
    />

    <section class="mt-8">
      <UiSectionHeading title="Brand" hint="Network, connection, Africa, intelligence" />
      <UiCard class="mt-4 flex flex-wrap items-center gap-8 p-6">
        <BrandLogo :size="32" />
        <BrandMark :size="44" />
        <BrandMark :size="28" />
        <span class="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#121614]">
          <BrandMark :size="24" />
        </span>
        <span class="text-[12px] text-[#606863]">Full logo · icon · app icon · favicon</span>
      </UiCard>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Colour" hint="Used sparingly. Green carries meaning, gold carries attention." />
      <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div v-for="s in swatches" :key="s.name">
          <div class="h-16 rounded-xl border border-[#e4e4de]" :class="s.swatch" />
          <p class="mt-1.5 text-[11px] text-[#606863]">{{ s.name }}</p>
        </div>
      </div>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Typography" />
      <UiCard class="mt-4 space-y-3 p-6">
        <p class="font-['Instrument_Serif',Georgia,serif] text-[38px] leading-tight text-[#121614]">Instrument Serif · display</p>
        <p class="text-[22px] font-semibold tracking-tight text-[#121614]">Inter Semibold · headings</p>
        <p class="text-[15px] text-[#121614]">Inter Regular · body copy at 15px</p>
        <p class="text-[13px] text-[#606863]">Inter · secondary at 13px</p>
        <p class="text-[11px] uppercase tracking-wide text-[#8f9792]">Inter · labels at 11px</p>
      </UiCard>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Controls" />
      <UiCard class="mt-4 space-y-5 p-6">
        <div class="flex flex-wrap items-center gap-2">
          <UiButton>Primary</UiButton>
          <UiButton variant="secondary">Secondary</UiButton>
          <UiButton variant="ghost">Ghost</UiButton>
          <UiButton variant="gold">Gold</UiButton>
          <UiButton variant="danger">Danger</UiButton>
          <UiButton disabled>Disabled</UiButton>
          <UiIconButton label="Example">
            <i class="fa-solid fa-wand-magic-sparkles text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
        </div>
        <UiDivider />
        <div class="grid gap-4 sm:grid-cols-2">
          <UiField label="Input" hint="With helper text">
            <UiInput placeholder="Ask African Intelligence" />
          </UiField>
          <UiField label="Textarea">
            <UiTextarea :rows="3" placeholder="Write a message" />
          </UiField>
        </div>
        <div class="flex flex-wrap items-center gap-6">
          <UiToggle v-model="toggle" label="Example toggle" />
          <UiSegmentedControl
            v-model="seg"
            :options="[
              { value: 'a', label: 'Option A' },
              { value: 'b', label: 'Option B' },
            ]"
          />
        </div>
      </UiCard>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Status" hint="Connectivity is a first-class state, never an error" />
      <UiCard class="mt-4 flex flex-wrap items-center gap-3 p-6">
        <UiBadge tone="brand">
          <UiDot />
          Connected to Afronet
        </UiBadge>
        <UiBadge tone="gold">Internet unavailable</UiBadge>
        <UiBadge tone="muted">Offline</UiBadge>
        <UiBadge tone="success">Delivered</UiBadge>
        <UiBadge tone="danger">Blocked</UiBadge>
        <UiBadge tone="outline">
          <i class="fa-solid fa-tower-broadcast text-[10px]" aria-hidden="true"></i>
          1 hop
        </UiBadge>
        <UiComingSoon />
      </UiCard>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Avatars and presence" />
      <UiCard class="mt-4 flex flex-wrap items-center gap-4 p-6">
        <UiAvatar
          v-for="c in contacts.slice(0, 5)"
          :key="c.id"
          :src="c.avatar"
          :name="c.name"
          :size="44"
          :presence="c.presence"
        />
      </UiCard>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Loading and progress" />
      <UiCard class="mt-4 space-y-5 p-6">
        <div class="flex items-center gap-3 text-[13px] text-[#606863]">
          <UiSpinner />
          Working on this device
        </div>
        <UiProgress :value="78" />
        <UiLoadingRows :rows="2" />
      </UiCard>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="States" hint="Every screen ships with all of them" />
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <UiStatePanel kind="empty" title="Nothing here yet" body="Files you receive over Afronet will appear in this view.">
          <template #action><UiButton size="sm">Add files</UiButton></template>
        </UiStatePanel>
        <UiStatePanel
          kind="offline"
          title="Internet unavailable. Afronet is still working."
          body="You are connected to 7 nearby devices. Messages and files move now; anything bound for the internet is queued."
        />
        <UiStatePanel
          kind="error"
          title="That transfer stopped"
          body="Sarah moved out of range mid-transfer. Afronet will resume automatically from 62%."
        >
          <template #action><UiButton size="sm" variant="secondary">Retry now</UiButton></template>
        </UiStatePanel>
        <UiStatePanel
          kind="success"
          title="Signed and queued"
          body="₦20,000 to @john is signed on this device and releases at the next gateway."
        />
        <UiStatePanel
          kind="permission"
          title="Allow nearby connections"
          body="Afronet needs local network access to find people around you. It never uploads your contacts."
        >
          <template #icon><i class="fa-solid fa-tower-broadcast text-[18px]" aria-hidden="true"></i></template>
          <template #action><UiButton size="sm">Allow</UiButton></template>
        </UiStatePanel>
        <UiStatePanel
          kind="empty"
          title="Synchronising"
          body="Afronet is reconciling messages, files and queued payments with the gateway."
        >
          <template #icon><UiSpinner /></template>
        </UiStatePanel>
      </div>
    </section>
  </div>
</template>

<script setup>
import { contacts } from '~/data/people'

useHead({ title: 'Design system — Afronet' })

const toggle = ref(true)
const seg = ref('a')

const swatches = [
  { name: 'Brand · deep green', swatch: 'bg-[#0b5d3e]' },
  { name: 'Brand soft', swatch: 'bg-[#eaf3ee]' },
  { name: 'Gold', swatch: 'bg-[#b07f15]' },
  { name: 'Gold soft', swatch: 'bg-[#faf3e3]' },
  { name: 'Ink', swatch: 'bg-[#121614]' },
  { name: 'Surface 2', swatch: 'bg-[#f7f7f4]' },
  { name: 'Line', swatch: 'bg-[#e4e4de]' },
  { name: 'Danger', swatch: 'bg-[#b22c26]' },
]
</script>
