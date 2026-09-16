<!-- app/pages/phone/index.vue -->

<template>
  <div class="mx-auto w-full max-w-3xl px-5 py-8">
    <UiPageHeader
      eyebrow="Communication layer"
      title="AfroPhone"
      description="Call an African ID or an Afronet number. When both people are on the mesh, the call never touches the internet."
    >
      <template #actions>
        <UiComingSoon label="Calling in V2" />
      </template>
    </UiPageHeader>

    <UiCard class="mt-6 flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <p class="text-[11px] text-[#8f9792]">Your Afronet number</p>
        <p class="mt-0.5 font-['Instrument_Serif',Georgia,serif] text-[24px] text-[#121614]">{{ me.phone }}</p>
      </div>
      <div class="text-right">
        <p class="text-[11px] text-[#8f9792]">African ID</p>
        <p class="mt-0.5 text-[15px] text-[#121614]">{{ me.username }}</p>
      </div>
    </UiCard>

    <div class="mt-6">
      <UiSegmentedControl
        v-model="tab"
        :options="[
          { value: 'recent', label: 'Recent' },
          { value: 'contacts', label: 'Contacts' },
          { value: 'favourites', label: 'Favourites' },
          { value: 'keypad', label: 'Keypad' },
        ]"
      />
    </div>

    <div class="mt-5">
      <!-- Recent -->
      <div v-if="tab === 'recent'" class="overflow-hidden rounded-2xl border border-[#e4e4de]">
        <div
          v-for="(r, i) in recents"
          :key="r.id"
          class="flex items-center gap-4 px-4 py-3.5"
          :class="i > 0 ? 'border-t border-[#e4e4de]' : ''"
        >
          <UiAvatar :src="r.person.avatar" :name="r.person.name" :size="38" :presence="r.person.presence" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-[#121614]">{{ r.person.name }}</p>
            <p class="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8f9792]">
              <!-- Font Awesome has no diagonal arrows, so the straight ones are turned 45°. -->
              <i v-if="r.dir === 'in'" class="fa-solid fa-arrow-down rotate-45 text-[10px] text-[#0b5d3e]" aria-hidden="true"></i>
              <i v-else-if="r.dir === 'out'" class="fa-solid fa-arrow-up rotate-45 text-[10px]" aria-hidden="true"></i>
              <i v-else class="fa-solid fa-phone-slash text-[10px] text-[#b22c26]" aria-hidden="true"></i>
              {{ r.time }} · {{ r.via }}
            </p>
          </div>
          <UiBadge :tone="r.person.presence === 'offline' ? 'muted' : 'brand'">
            {{ presenceLabel[r.person.presence] }}
          </UiBadge>
        </div>
      </div>

      <!-- Contacts -->
      <div v-else-if="tab === 'contacts'" class="overflow-hidden rounded-2xl border border-[#e4e4de]">
        <div
          v-for="(c, i) in contacts"
          :key="c.id"
          class="flex items-center gap-4 px-4 py-3.5"
          :class="i > 0 ? 'border-t border-[#e4e4de]' : ''"
        >
          <UiAvatar :src="c.avatar" :name="c.name" :size="38" :presence="c.presence" />
          <div class="min-w-0 flex-1">
            <p class="truncate text-[13px] font-medium text-[#121614]">{{ c.name }}</p>
            <p class="text-[11px] text-[#8f9792]">{{ c.username }}</p>
          </div>
          <div class="flex gap-1">
            <UiButton size="sm" variant="secondary">
              <template #icon><i class="fa-solid fa-phone text-[12px]" aria-hidden="true"></i></template>
              Call
            </UiButton>
            <UiButton size="sm" variant="ghost">
              <template #icon><i class="fa-solid fa-video text-[12px]" aria-hidden="true"></i></template>
              Video
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Favourites -->
      <UiStatePanel
        v-else-if="tab === 'favourites'"
        title="No favourites yet"
        body="Star the people you call most and they will appear here, with their Afronet availability."
      >
        <template #icon><i class="fa-solid fa-star text-[18px]" aria-hidden="true"></i></template>
        <template #action>
          <UiButton size="sm" variant="secondary">Choose contacts</UiButton>
        </template>
      </UiStatePanel>

      <!-- Keypad -->
      <UiCard v-else class="mx-auto max-w-xs p-6">
        <div class="mb-5 h-10 text-center font-['Instrument_Serif',Georgia,serif] text-[28px] text-[#121614]">
          <template v-if="dialled">{{ dialled }}</template>
          <span v-else class="text-[#8f9792]">@username or number</span>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="k in keys"
            :key="k"
            class="flex h-14 items-center justify-center rounded-xl border border-[#e4e4de] text-[18px] text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            :aria-label="k === '⌫' ? 'Delete' : undefined"
            @click="press(k)"
          >
            <i v-if="k === '⌫'" class="fa-solid fa-delete-left text-[18px] text-[#606863]" aria-hidden="true"></i>
            <template v-else>{{ k }}</template>
          </button>
        </div>
        <UiButton block class="mt-4" disabled>
          <template #icon><i class="fa-solid fa-phone text-[14px]" aria-hidden="true"></i></template>
          Call
        </UiButton>
        <p class="mt-3 text-center text-[11px] text-[#8f9792]">Calling opens after V1. Message and file transfer work now.</p>
      </UiCard>
    </div>
  </div>
</template>

<script setup>
import { contacts, me, presenceLabel } from '~/data/people'

useHead({ title: 'AfroPhone — Afronet' })

// recent | contacts | favourites | keypad
const tab = ref('recent')
const dialled = ref('')

// dir — in | out | missed
const recents = [
  { id: 'r1', person: contacts[0], dir: 'in', time: 'Today 08:41', via: 'Afronet · 1 hop' },
  { id: 'r2', person: contacts[1], dir: 'out', time: 'Today 07:02', via: 'Afronet + Internet' },
  { id: 'r3', person: contacts[3], dir: 'missed', time: 'Yesterday', via: 'Queued — was offline' },
  { id: 'r4', person: contacts[4], dir: 'in', time: 'Tue', via: 'Internet gateway' },
]

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '@', '0', '⌫']

const press = (k) => {
  dialled.value = k === '⌫' ? dialled.value.slice(0, -1) : dialled.value + k
}
</script>
