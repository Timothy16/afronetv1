<!-- app/components/Onboarding/ModelReady.vue -->

<!--
  Screen 6 — the hand-off to the chat.

  The link is a plain anchor on purpose. /chat is cross-origin isolated per document, and a
  client-side route change would arrive without that, leaving the AI unable to start.
-->
<template>
  <OnboardingShell>
    <template #header>
      <NuxtLink to="/" aria-label="Afronet home">
        <BrandMark :size="32" />
      </NuxtLink>
    </template>

    <div class="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span class="grid h-20 w-20 place-items-center rounded-full bg-[#eaf3ee] text-[#0b5d3e]">
        <i class="fa-solid fa-circle-check text-[36px]" aria-hidden="true"></i>
      </span>

      <h1 class="mt-7 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
        {{ modelReady.title }}
      </h1>
      <p class="mt-2.5 max-w-sm text-[15px] leading-relaxed text-[#606863]">{{ modelReady.body }}</p>

      <p class="mt-6 inline-flex items-center gap-2 rounded-full bg-[#f7f7f4] px-4 py-2 text-[13px] font-medium text-[#121614]">
        <i class="fa-solid fa-microchip text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
        {{ label }} · on this device
      </p>
    </div>

    <template #footer>
      <!-- A full page load, so the chat page starts with everything its AI needs. -->
      <a
        :href="CHAT_ROUTE"
        class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-transparent bg-[#0b5d3e] px-6 text-[15px] font-medium text-[#ffffff] transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:opacity-90"
      >
        {{ modelReady.action }}
      </a>
    </template>
  </OnboardingShell>
</template>

<script setup>
import { CHAT_ROUTE, modelReady } from '~/data/onboarding'

const props = defineProps({
  modelId: { type: String, default: '' },
})

const { model } = useLLM()

const label = computed(() => model.value?.label ?? 'African Intelligence')
</script>
