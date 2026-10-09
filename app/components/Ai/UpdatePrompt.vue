<!-- app/components/Ai/UpdatePrompt.vue -->

<!--
  A new version is ready. The app never refreshes by itself: that would throw away a reply being
  written. The prompt waits while the AI is answering, then offers the refresh.
-->
<template>
  <section
    v-if="show"
    role="status"
    class="mx-auto flex w-full max-w-2xl flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-[#e4e4de] border-l-4 border-l-[#0b5d3e] bg-[#ffffff] px-4 py-3"
  >
    <p class="min-w-0 flex-1 text-[13px] text-[#121614]">
      A new version of Afronet is ready.
      <span v-if="generating" class="text-[#8f9792]">It will wait until this answer is finished.</span>
    </p>
    <button
      type="button"
      class="rounded-full border border-[#e4e4de] px-3 py-1 text-[12px] text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] disabled:opacity-40"
      :disabled="generating"
      @click="refresh"
    >
      Refresh now
    </button>
    <button
      type="button"
      class="text-[12px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
      @click="dismissed = true"
    >
      Later
    </button>
  </section>
</template>

<script setup>
defineProps({
  generating: { type: Boolean, default: false },
})

const { $pwa } = useNuxtApp()
const dismissed = ref(false)

const show = computed(() => Boolean($pwa?.needRefresh) && !dismissed.value)

const refresh = async () => {
  dismissed.value = true
  await $pwa?.updateServiceWorker?.()
}
</script>
