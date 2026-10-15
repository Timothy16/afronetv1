<!-- app/components/Store/TabBar.vue -->

<!-- The store's bottom tabs on phones. A dot on My Apps when something can be updated. -->
<template>
  <nav class="fixed inset-x-0 bottom-0 z-30 border-t border-[#e4e4de] bg-[#ffffff] md:hidden" aria-label="Store sections">
    <div class="grid grid-cols-5">
      <NuxtLink
        v-for="n in storeNav"
        :key="n.to"
        :to="n.to"
        class="relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
        :class="isActive(n) ? 'text-[#121614]' : 'text-[#8f9792]'"
      >
        <i class="fa-solid text-[16px]" :class="n.icon" aria-hidden="true"></i>
        {{ n.label }}
        <span
          v-if="n.to === '/store/my-apps' && updates.length"
          class="absolute right-[26%] top-1.5 h-2 w-2 rounded-full bg-[#0b5d3e]"
          aria-hidden="true"
        />
      </NuxtLink>
    </div>
  </nav>
</template>

<script setup>
import { storeNav } from '~/data/store'

const { updates } = useAppLibrary()

const route = useRoute()

const isActive = (n) => (n.exact ? route.path === n.to : route.path.startsWith(n.to))
</script>
