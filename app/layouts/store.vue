<!-- app/layouts/store.vue -->

<!--
  The App Store shell: its own top bar and phone tabs, and a single scrolling main area.
  Sized to the viewport rather than to a parent height chain, like the Afronet shell, so
  <main> is the only thing that scrolls and the tabs stay put on a phone.

  A paper background with white cards, which is how the store tells itself apart from the
  rest of the app without introducing a colour.
-->
<template>
  <div
    class="flex h-[100dvh] w-full flex-col bg-[#f7f7f4] font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[#121614] antialiased"
  >
    <StoreHeader />
    <main class="afro-scroll flex-1 overflow-y-auto">
      <div class="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 md:pb-12 lg:px-8">
        <slot />
      </div>
    </main>
    <StoreTabBar />
  </div>
</template>

<script setup>
// The catalogue is fetched once here, during server rendering, so every store screen below
// has it without each one asking for it.
const { loadCatalogue, hydrateSaved, hydrateInstalled, measureFreeSpace } = useAppLibrary()

await loadCatalogue()

// After render, never during it: what this device remembers must not change what the server
// drew, or the page would rebuild itself on arrival.
onMounted(() => {
  hydrateSaved()
  hydrateInstalled()
  measureFreeSpace()
})
</script>
