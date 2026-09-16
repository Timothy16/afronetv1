<!-- app/layouts/default.vue -->

<!--
  The Afronet shell: top bar, sync banner, a scrolling main area, the desktop
  status bar and the mobile tab bar. The root is sized to the viewport rather
  than to a parent height chain, so <main> is the only thing that scrolls.
-->
<template>
  <div
    class="flex h-[100dvh] w-full flex-col bg-[#ffffff] font-[Inter,ui-sans-serif,system-ui,sans-serif] text-[#121614] antialiased"
  >
    <ShellTopBar />
    <ShellSyncBanner />
    <main class="afro-scroll flex-1 overflow-y-auto pb-16 md:pb-0">
      <slot />
    </main>
    <ShellStatusBar />
    <ShellMobileNav />
  </div>
</template>
