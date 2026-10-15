<!-- app/components/Store/AppCard.vue -->

<!--
  One app, in the two shapes the store needs: a wide row for lists and search results, and
  a narrow tile for the scrolling rails on the home page. Both are links, so an app listing
  can be opened in a new tab, shared, or reached with the keyboard.

  The right-hand side always answers the same question — what would happen if I tapped
  this: a percentage while it downloads, "Installed" once it is here, otherwise the price.
-->
<template>
  <NuxtLink
    :to="`/store/app/${app.id}`"
    class="rounded-2xl text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
    :class="variant === 'tile' ? 'flex w-[172px] shrink-0 flex-col p-2' : 'flex w-full items-center gap-3.5 p-2.5'"
  >
    <template v-if="variant === 'tile'">
      <StoreAppIcon :icon="app.icon" :tone="app.tone" size="lg" :muted="app.status === 'suspended'" />
      <span class="mt-3 truncate text-[14px] font-semibold text-[#121614]">{{ app.name }}</span>
      <span class="truncate text-[12px] text-[#606863]">{{ app.creatorName }}</span>
      <span class="mt-2 flex items-center gap-1.5 text-[11.5px] text-[#8f9792]">
        <span v-if="app.ratingCount > 0" class="inline-flex items-center gap-1 font-medium text-[#121614]">
          <i class="fa-solid fa-star text-[9px] text-[#b07f15]" aria-hidden="true"></i>
          {{ app.rating.toFixed(1) }}
        </span>
        <span v-else>New</span>
        <span>{{ formatMB(app.downloadMB) }}</span>
      </span>
      <span class="mt-1.5">
        <span v-if="task" class="text-[12px] font-semibold text-[#0b5d3e]">{{ Math.round(task.progress) }}%</span>
        <span v-else-if="inst" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0b5d3e]">
          <i class="fa-solid fa-circle-check text-[10px]" aria-hidden="true"></i>
          Installed
        </span>
        <StorePriceTag v-else :price="app.price" />
      </span>
    </template>

    <template v-else>
      <StoreAppIcon :icon="app.icon" :tone="app.tone" size="md" :muted="app.status === 'suspended'" />
      <span class="min-w-0 flex-1">
        <span class="block truncate text-[14.5px] font-semibold text-[#121614]">{{ app.name }}</span>
        <span class="block truncate text-[12.5px] text-[#606863]">{{ app.tagline }}</span>
        <span class="mt-1 flex items-center gap-2 text-[11.5px] text-[#8f9792]">
          <span v-if="app.ratingCount > 0" class="inline-flex items-center gap-1 font-semibold text-[#121614]">
            <i class="fa-solid fa-star text-[9px] text-[#b07f15]" aria-hidden="true"></i>
            {{ app.rating.toFixed(1) }}
          </span>
          <span v-else>New</span>
          <span>{{ formatMB(app.downloadMB) }}</span>
          <span>{{ app.category }}</span>
        </span>
      </span>
      <span class="shrink-0 pl-2">
        <span v-if="task" class="text-[12px] font-semibold text-[#0b5d3e]">{{ Math.round(task.progress) }}%</span>
        <span v-else-if="inst" class="inline-flex items-center gap-1 text-[12px] font-semibold text-[#0b5d3e]">
          <i class="fa-solid fa-circle-check text-[10px]" aria-hidden="true"></i>
          Installed
        </span>
        <StorePriceTag v-else :price="app.price" />
      </span>
    </template>
  </NuxtLink>
</template>

<script setup>
import { formatMB } from '~/data/store'

const props = defineProps({
  app: { type: Object, required: true },
  // row | tile
  variant: { type: String, default: 'row' },
})

const { getInstalled, getDownload } = useAppLibrary()

const inst = computed(() => getInstalled(props.app.id))
const task = computed(() => getDownload(props.app.id))
</script>
