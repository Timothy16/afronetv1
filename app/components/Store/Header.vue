<!-- app/components/Store/Header.vue -->

<!--
  The store's own top bar. Separate from ShellTopBar because the store is a place of its
  own inside Afronet, with its own sections and its own search.

  The strip at the bottom appears only when the browser has genuinely lost its connection.
  This release needs one — downloading, buying and launching all check in with the server —
  so the honest thing is to say so once, at the top, rather than let each button fail.

  The link back to the chat is a plain anchor, not a NuxtLink: /chat is cross-origin
  isolated per document and has to be entered with a full page load.
-->
<template>
  <header class="sticky top-0 z-30 border-b border-[#e4e4de] bg-[#ffffff]/95 backdrop-blur">
    <div class="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 lg:px-8">
      <NuxtLink to="/store" class="flex shrink-0 items-center gap-2" aria-label="Afronet Apps home">
        <BrandMark :size="28" />
        <span class="hidden text-[15px] font-semibold tracking-tight text-[#121614] sm:block">
          Afronet <span class="text-[#606863]">Apps</span>
        </span>
      </NuxtLink>

      <nav class="ml-2 hidden items-center gap-1 md:flex" aria-label="Store sections">
        <NuxtLink
          v-for="n in storeNav"
          :key="n.to"
          :to="n.to"
          class="rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="isActive(n) ? 'bg-[#f7f7f4] text-[#121614]' : 'text-[#606863] hover:text-[#121614]'"
        >
          {{ n.label }}
        </NuxtLink>
      </nav>

      <form role="search" class="relative ml-auto hidden w-60 lg:block" @submit.prevent="go">
        <i
          class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[13px] text-[#8f9792]"
          aria-hidden="true"
        ></i>
        <UiInput v-model="q" size="sm" aria-label="Search apps" placeholder="Search apps or what they do" class="pl-10" />
      </form>

      <div class="ml-auto flex items-center gap-1.5 lg:ml-0">
        <a
          href="/chat"
          class="hidden h-9 items-center gap-2 rounded-full px-3 text-[12.5px] font-medium text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] sm:inline-flex"
        >
          <i class="fa-solid fa-comment-dots text-[11px]" aria-hidden="true"></i>
          AfroIntel
        </a>

        <UiButton to="/studio" size="sm" class="ml-1 hidden lg:inline-flex">
          <template #icon><i class="fa-solid fa-wand-magic-sparkles text-[11px]" aria-hidden="true"></i></template>
          Create an app
        </UiButton>
      </div>
    </div>

    <div v-if="!online" class="bg-[#121614] text-[#ffffff]">
      <div class="mx-auto flex max-w-7xl items-center gap-2.5 px-4 py-2 text-[12.5px] lg:px-8">
        <i class="fa-solid fa-link-slash shrink-0 text-[11px] text-[#faf3e3]" aria-hidden="true"></i>
        <span><strong>No connection.</strong> {{ storeCopy.needsConnection }}</span>
      </div>
    </div>
  </header>
</template>

<script setup>
import { storeCopy, storeNav } from '~/data/store'

const { online } = useAppLibrary()

const route = useRoute()
const q = ref('')

const isActive = (n) => (n.exact ? route.path === n.to : route.path.startsWith(n.to))

const go = () => {
  navigateTo(q.value.trim() ? `/store/search?q=${encodeURIComponent(q.value.trim())}` : '/store/search')
}
</script>
