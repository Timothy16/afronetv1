<!-- app/components/Studio/ListingPreview.vue -->

<!--
  The listing as the store will render it, built from the same pieces the real listing page
  uses — the same icon, the same price tag, the same wording. A developer editing a
  description can see the line break where a user will see it.
-->
<template>
  <div class="overflow-hidden rounded-3xl border border-[#e4e4de] bg-[#ffffff]">
    <div class="p-5">
      <div class="flex items-start gap-3">
        <StoreAppIcon :icon="app.icon" :tone="app.config.tone" size="lg" />
        <div class="min-w-0">
          <p class="text-[18px] font-semibold leading-tight text-[#121614]">{{ app.name || 'App name' }}</p>
          <p class="text-[13px] text-[#606863]">{{ app.tagline || 'Short description' }}</p>
          <p class="mt-1 text-[12.5px] font-medium text-[#0b5d3e]">{{ name }}</p>
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-[#606863]">
        <span>{{ formatMB(app.packageMB) }}</span>
        <span>·</span>
        <StorePriceTag :price="app.pricingModel === 'paid' ? app.price : 0" />
        <span>·</span>
        <span>New</span>
      </div>

      <div
        class="mt-3 h-10 rounded-xl text-center text-[14px] font-medium leading-10 text-[#ffffff]"
        :class="app.pricingModel === 'paid' ? 'bg-[#121614]' : 'bg-[#0b5d3e]'"
      >
        {{ app.pricingModel === 'paid' ? `Buy · ${formatNaira(app.price)}` : 'Get · Free' }}
      </div>
    </div>

    <div class="p-5 text-[13px]">
      <p class="leading-relaxed text-[#606863]">{{ app.description || 'Full description' }}</p>
      <ul v-if="app.features.length" class="mt-3 space-y-1">
        <li v-for="f in app.features" :key="f" class="flex items-start gap-2 text-[#121614]">
          <i class="fa-solid fa-circle-check mt-1 shrink-0 text-[10px] text-[#0b5d3e]" aria-hidden="true"></i>
          {{ f }}
        </li>
      </ul>
      <p v-if="needs.length" class="mt-3 text-[12px] text-[#b07f15]">
        Will show as needing a connection for: {{ needs.join(', ') }}.
      </p>
    </div>
  </div>
</template>

<script setup>
import { formatMB, formatNaira } from '~/data/store'
import { connectionNeeds } from '~/data/studio'

const props = defineProps({
  app: { type: Object, required: true },
})

// The listing credits whoever is signed in, which is who the server will credit on publish.
const { name } = useStoreUser()

const needs = computed(() => connectionNeeds(props.app.config))
</script>
