<!-- app/components/Shell/SyncBanner.vue -->

<template>
  <Transition
    enter-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
    enter-from-class="-translate-y-2 opacity-0"
    leave-active-class="transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
    leave-to-class="-translate-y-2 opacity-0"
  >
    <div
      v-if="syncing"
      role="status"
      class="flex items-center justify-center gap-2 border-b border-[#e4e4de] bg-[#eaf3ee] px-4 py-2 text-[12px] text-[#0b5d3e]"
    >
      <i class="fa-solid fa-arrows-rotate animate-spin text-[12px]" aria-hidden="true"></i>
      Afronet is synchronising your messages, files and queued payments.
    </div>
  </Transition>
</template>

<script setup>
const { syncing } = useAfronet()
</script>
