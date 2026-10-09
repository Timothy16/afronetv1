<!-- app/components/Onboarding/Restore.vue -->

<!--
  Screen 1 — what Afronet carries across with you.

  The list is shown, not chosen from: everything the African ID holds comes back together, so the
  rows are display only and the ticks are a statement rather than a control. Two states in one
  component — the list, then the restore itself walking the items one at a time.

  UI and simulation only. Nothing is read from a previous install and nothing is decrypted.

  Emits `done` when it finishes — the flow then shows the account form.
-->
<template>
  <OnboardingShell>
    <template #header>
      <NuxtLink to="/" aria-label="Afronet home">
        <BrandMark :size="32" />
      </NuxtLink>
    </template>

    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614] sm:text-[30px]">
      {{ restoring ? restoreIntro.restoringTitle : restoreIntro.title }}
    </h1>
    <p class="mt-2.5 text-[15px] leading-relaxed text-[#606863]">
      {{ restoring ? restoreIntro.restoringBody : restoreIntro.body }}
    </p>

    <ul class="mt-7 divide-y divide-[#e4e4de] overflow-hidden rounded-2xl border border-[#e4e4de]">
      <li v-for="(item, i) in restoreItems" :key="item.id" class="flex items-center gap-3 px-4 py-3.5">
        <!-- restoring: per-item progress · otherwise: a fixed tick, not a choice -->
        <template v-if="restoring">
          <i v-if="i < step" class="fa-solid fa-check w-5 text-center text-[13px] text-[#147a4c]" aria-hidden="true"></i>
          <span v-else-if="i === step" class="w-5 text-center"><UiSpinner /></span>
          <span v-else class="h-5 w-5 shrink-0 rounded-full border-2 border-[#e4e4de]"></span>
        </template>
        <span
          v-else
          class="grid h-5 w-5 shrink-0 place-items-center rounded-md border-2 border-[#0b5d3e] bg-[#0b5d3e] text-[#ffffff]"
          aria-hidden="true"
        >
          <i class="fa-solid fa-check text-[10px]"></i>
        </span>

        <span class="min-w-0 flex-1">
          <span
            class="block text-[15px] font-medium"
            :class="restoring && i > step ? 'text-[#8f9792]' : 'text-[#121614]'"
          >
            {{ item.title }}
          </span>
          <span class="block text-[13px] leading-relaxed text-[#606863]">{{ item.detail }}</span>
        </span>
        <span class="shrink-0 text-[13px] tabular-nums text-[#606863]">{{ item.size }}</span>
      </li>
    </ul>

    <template #footer>
      <UiButton v-if="!restoring" block size="lg" @click="start">Continue</UiButton>
    </template>
  </OnboardingShell>
</template>

<script setup>
import { restoreIntro, restoreItems } from '~/data/onboarding'

const emit = defineEmits(['done'])

const restoring = ref(false)
const step = ref(0)

let timer

const start = () => {
  step.value = 0
  restoring.value = true
}

// One item a second, then a beat on the last tick before handing over.
watch([restoring, step], () => {
  if (!restoring.value) return
  clearTimeout(timer)
  if (step.value >= restoreItems.length) {
    timer = setTimeout(() => emit('done'), 500)
    return
  }
  timer = setTimeout(() => {
    step.value += 1
  }, 1000)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>
