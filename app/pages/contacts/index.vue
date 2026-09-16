<!-- app/pages/contacts/index.vue -->

<template>
  <div class="mx-auto w-full max-w-4xl px-5 py-8">
    <UiPageHeader
      eyebrow="Communication layer"
      title="Contacts"
      :description="`${reachable} of ${contacts.length} people are reachable right now — Afronet checks continuously, even with no internet.`"
    />

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[14rem] flex-1">
        <i
          class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
          aria-hidden="true"
        ></i>
        <UiInput v-model="q" placeholder="Search name or @username" class="pl-10" />
      </div>
      <UiSegmentedControl
        v-model="filter"
        :options="[
          { value: 'all', label: 'All' },
          { value: 'reachable', label: 'Reachable' },
          { value: 'offline', label: 'Offline' },
        ]"
      />
    </div>

    <div class="mt-5 space-y-2">
      <UiCard v-for="c in list" :key="c.id" class="flex flex-wrap items-center gap-4 p-4" interactive>
        <UiAvatar :src="c.avatar" :name="c.name" :size="44" :presence="c.presence" />
        <div class="min-w-[9rem] flex-1">
          <p class="flex items-center gap-1.5 text-[14px] font-medium text-[#121614]">
            {{ c.name }}
            <i v-if="c.verified" class="fa-solid fa-shield-halved text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
          </p>
          <p class="mt-0.5 text-[12px] text-[#606863]">{{ c.username }} · {{ c.role }} · {{ c.country }}</p>
        </div>
        <div class="text-right">
          <UiBadge :tone="c.presence === 'offline' ? 'muted' : c.presence === 'dnd' ? 'danger' : 'brand'">
            {{ presenceLabel[c.presence] }}
          </UiBadge>
          <p class="mt-1 text-[11px] text-[#8f9792]">{{ reach(c) }}</p>
        </div>
        <div class="flex items-center gap-0.5">
          <UiIconButton :label="`Message ${c.name}`" @click="go('/messages')">
            <i class="fa-solid fa-message text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
          <UiIconButton :label="`Share a file with ${c.name}`" @click="go('/files')">
            <i class="fa-solid fa-share-nodes text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
          <UiIconButton :label="`Call ${c.name}`" @click="go('/phone')">
            <i class="fa-solid fa-phone text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
          <UiIconButton :label="`Video call ${c.name}`" @click="go('/phone')">
            <i class="fa-solid fa-video text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
        </div>
      </UiCard>
    </div>

    <p class="mt-6 flex items-center gap-2 text-[12px] text-[#8f9792]">
      Voice and video calling arrive after V1
      <UiComingSoon />. Messaging and local file transfer work today.
    </p>
  </div>
</template>

<script setup>
import { contacts, presenceLabel } from '~/data/people'

useHead({ title: 'Contacts — Afronet' })

// all | reachable | offline
const filter = ref('all')
const q = ref('')

const list = computed(() =>
  contacts.filter(
    (c) =>
      (filter.value === 'all' ||
        (filter.value === 'reachable' ? c.presence !== 'offline' : c.presence === 'offline')) &&
      (c.name.toLowerCase().includes(q.value.toLowerCase()) || c.username.includes(q.value.toLowerCase())),
  ),
)

const reachable = contacts.filter((c) => c.presence !== 'offline').length

const reach = (c) =>
  c.presence === 'offline'
    ? c.lastSeen
    : c.hops
      ? `${c.hops} hop away · available for Afronet call`
      : 'Via internet gateway'

const go = (path) => navigateTo(path)
</script>
