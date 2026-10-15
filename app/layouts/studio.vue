<!-- app/layouts/studio.vue -->

<!--
  Afronet Studio: a dark fixed sidebar on a wide screen, a drawer and bottom tabs on a
  phone. Unlike the store, this scrolls the document rather than an inner pane — a
  developer's app list and build settings are long, and a dashboard that traps scrolling
  inside a panel is harder to use on a laptop.
-->
<template>
  <div class="min-h-[100dvh] w-full bg-[#f7f7f4] font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[#121614] antialiased">
    <aside class="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#121614] px-4 py-5 lg:flex">
      <NuxtLink to="/studio" class="mb-6 flex items-center gap-2 px-1" aria-label="Afronet Studio">
        <BrandMark :size="26" />
        <span class="text-[15px] font-semibold tracking-tight text-[#ffffff]">
          Afronet <span class="text-[#ffffff]/60">Studio</span>
        </span>
      </NuxtLink>
      <nav class="flex min-h-0 flex-1 flex-col" aria-label="Afronet Studio">
        <StudioNav />
      </nav>
    </aside>

    <div class="lg:pl-64">
      <header
        class="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-[#e4e4de] bg-[#ffffff]/95 px-4 backdrop-blur lg:px-8"
      >
        <button
          class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] lg:hidden"
          aria-label="Open Studio menu"
          @click="drawer = true"
        >
          <i class="fa-solid fa-bars text-[15px]" aria-hidden="true"></i>
        </button>

        <NuxtLink to="/studio" class="flex items-center gap-2 lg:hidden" aria-label="Afronet Studio">
          <BrandMark :size="24" />
          <span class="text-[14px] font-semibold tracking-tight">
            Afronet <span class="text-[#606863]">Studio</span>
          </span>
        </NuxtLink>

        <span class="ml-auto text-[12.5px] text-[#606863]">{{ creditsLeft }} AI generations left</span>
      </header>

      <main class="mx-auto w-full max-w-[1280px] px-4 pb-28 pt-6 lg:px-8 lg:pb-12">
        <slot />
      </main>
    </div>

    <nav class="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-[#e4e4de] bg-[#ffffff] lg:hidden" aria-label="Studio">
      <NuxtLink
        v-for="t in tabs"
        :key="t.to"
        :to="t.to"
        class="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium"
        :class="isActive(t) ? 'text-[#121614]' : 'text-[#8f9792]'"
      >
        <span
          v-if="t.primary"
          class="flex h-7 w-10 items-center justify-center rounded-lg bg-[#0b5d3e] text-[#ffffff]"
        >
          <i class="fa-solid text-[13px]" :class="t.icon" aria-hidden="true"></i>
        </span>
        <i v-else class="fa-solid text-[16px]" :class="t.icon" aria-hidden="true"></i>
        {{ t.label }}
      </NuxtLink>
      <button
        class="flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium text-[#8f9792]"
        @click="drawer = true"
      >
        <i class="fa-solid fa-bars text-[16px]" aria-hidden="true"></i>
        More
      </button>
    </nav>

    <Teleport to="body">
      <Transition name="drawer" :duration="260">
        <div v-if="drawer" class="fixed inset-0 z-50 lg:hidden">
          <div class="drawer-backdrop absolute inset-0 bg-black/50" @click="drawer = false" />
          <aside
            class="drawer-panel afro-scroll absolute inset-y-0 left-0 flex w-72 flex-col overflow-y-auto bg-[#121614] px-4 py-5 font-[Inter,ui-sans-serif,system-ui,sans-serif]"
            role="dialog"
            aria-modal="true"
            aria-label="Studio menu"
          >
            <div class="mb-6 flex items-center justify-between px-1">
              <span class="flex items-center gap-2">
                <BrandMark :size="24" />
                <span class="text-[14px] font-semibold tracking-tight text-[#ffffff]">
                  Afronet <span class="text-[#ffffff]/60">Studio</span>
                </span>
              </span>
              <button
                class="rounded-lg p-1.5 text-[#ffffff]/60 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#ffffff]/10"
                aria-label="Close menu"
                @click="drawer = false"
              >
                <i class="fa-solid fa-xmark text-[14px]" aria-hidden="true"></i>
              </button>
            </div>
            <nav class="flex min-h-0 flex-1 flex-col" aria-label="Afronet Studio">
              <StudioNav @navigate="drawer = false" />
            </nav>
          </aside>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
const { creditsLeft, loadDevApps, loadQuota } = useStudio()
const { loadCatalogue } = useAppLibrary()

// Studio needs both: its own builds, and the catalogue — publishing writes into it, and a
// published build links to its live listing. Fetched here during server rendering so every
// Studio screen below has them.
await Promise.all([loadDevApps(), loadCatalogue(), loadQuota()])

const route = useRoute()

const drawer = ref(false)

const tabs = [
  { to: '/studio', label: 'Overview', icon: 'fa-gauge', exact: true },
  { to: '/studio/apps', label: 'Apps', icon: 'fa-cubes' },
  { to: '/studio/create', label: 'Create', icon: 'fa-plus', primary: true },
]

const isActive = (t) => (t.exact ? route.path === t.to : route.path.startsWith(t.to))

// Closing on navigation as well as on tap: a drawer left open over a new page is a trap.
watch(() => route.fullPath, () => {
  drawer.value = false
})
</script>

<style scoped>
.drawer-enter-active .drawer-backdrop,
.drawer-leave-active .drawer-backdrop {
  transition: opacity 0.22s cubic-bezier(0.23, 1, 0.32, 1);
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.26s cubic-bezier(0.23, 1, 0.32, 1);
}

.drawer-enter-from .drawer-backdrop,
.drawer-leave-to .drawer-backdrop {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer-backdrop,
  .drawer-leave-active .drawer-backdrop,
  .drawer-enter-active .drawer-panel,
  .drawer-leave-active .drawer-panel {
    transition: none;
  }
}
</style>
