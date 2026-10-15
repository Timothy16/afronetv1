<!-- app/components/Studio/AppSubnav.vue -->

<!--
  The header above every screen that is about one app: which app, where it is in the
  journey, the actions for this screen, and the tabs between the five places a developer
  works on it. Keeps the name and the status in the same spot whether they are building,
  testing, writing the listing, pricing it or publishing.

  Manage only appears once an app is actually live, because until then there is nothing to
  manage.
-->
<template>
  <div class="mb-6">
    <NuxtLink
      to="/studio/apps"
      class="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#606863] hover:text-[#121614]"
    >
      <i class="fa-solid fa-arrow-left text-[11px]" aria-hidden="true"></i>
      My Apps
    </NuxtLink>

    <div class="flex flex-wrap items-center gap-3">
      <StoreAppIcon :icon="app.icon" :tone="app.config.tone" size="md" :muted="app.status === 'archived'" />

      <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-2">
          <h1 class="font-['Instrument_Serif',Georgia,serif] text-[24px] leading-tight text-[#121614]">
            {{ app.name }}
          </h1>
          <StudioStatusBadge :status="app.status" />
        </div>
        <p class="truncate text-[13px] text-[#606863]">
          v{{ app.version }} ·
          {{ app.testedAt ? `tested ${formatDate(app.testedAt)}` : 'not tested since the last change' }}
        </p>
      </div>

      <div v-if="$slots.actions" class="flex flex-wrap items-center gap-1.5">
        <slot name="actions" />
      </div>
    </div>

    <nav class="no-scrollbar mt-5 flex gap-1 overflow-x-auto border-b border-[#e4e4de]" aria-label="App sections">
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :class="isActive(t) ? 'border-[#121614] text-[#121614]' : 'border-transparent text-[#606863] hover:text-[#121614]'"
      >
        {{ t.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup>
import { formatDate } from '~/data/store'

const props = defineProps({
  app: { type: Object, required: true },
})

const route = useRoute()

const tabs = computed(() => {
  const base = `/studio/apps/${props.app.id}`
  return [
    ...(props.app.storeAppId ? [{ to: base, label: 'Manage', exact: true }] : []),
    { to: `/studio/builder/${props.app.id}`, label: 'Build' },
    { to: `${base}/test`, label: 'Test' },
    { to: `${base}/listing`, label: 'Listing' },
    { to: `${base}/pricing`, label: 'Pricing' },
    { to: `${base}/publish`, label: 'Publish' },
  ]
})

const isActive = (t) => (t.exact ? route.path === t.to : route.path === t.to)
</script>
