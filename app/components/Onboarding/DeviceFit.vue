<!-- app/components/Onboarding/DeviceFit.vue -->

<!--
  Screen 3 — what this device can actually run, measured rather than asserted.

  Every figure comes from the checks the AI engine itself uses: the graphics-chip or processor
  decision, the thread count, the browser's storage estimate, and the recommended model's real
  download size. The short scan is honest — those checks genuinely run while it shows.
-->
<template>
  <OnboardingShell>
    <template #header>
      <BrandMark :size="32" />
    </template>

    <div v-if="scanning" class="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <span class="grid h-20 w-20 place-items-center rounded-[26px] bg-[#eaf3ee] text-[#0b5d3e]">
        <i class="fa-solid fa-mobile-screen text-[30px]" aria-hidden="true"></i>
      </span>
      <h1 class="mt-7 font-['Instrument_Serif',Georgia,serif] text-[26px] leading-tight text-[#121614]">
        Getting to know your device
      </h1>
      <ul class="mt-6 w-full max-w-[260px] space-y-3 text-left" aria-live="polite">
        <li
          v-for="(check, i) in deviceChecks"
          :key="check"
          class="flex items-center gap-3 text-[15px] transition-opacity duration-200"
          :class="i <= done ? 'opacity-100' : 'opacity-40'"
        >
          <i v-if="i < done" class="fa-solid fa-check w-4 text-center text-[12px] text-[#147a4c]" aria-hidden="true"></i>
          <span v-else-if="i === done" class="w-4 text-center"><UiSpinner /></span>
          <span v-else class="w-4"></span>
          <span class="text-[#121614]">{{ check }}</span>
        </li>
      </ul>
    </div>

    <template v-else>
      <p class="text-[13px] font-medium text-[#606863]">{{ deviceLabel }}</p>
      <h1 class="mt-1 font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614] sm:text-[30px]">
        {{ roomy ? deviceFit.fitTitle : deviceFit.tightTitle }}
      </h1>
      <p class="mt-2 text-[15px] leading-relaxed text-[#606863]">
        {{ roomy ? deviceFit.fitBody : deviceFit.tightBody }}
      </p>

      <div class="mt-7 divide-y divide-[#e4e4de] overflow-hidden rounded-2xl border border-[#e4e4de]">
        <div v-if="storage" class="p-4 sm:p-5">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-hard-drive w-5 text-center text-[14px] text-[#606863]" aria-hidden="true"></i>
            <p class="flex-1 text-[15px] font-medium text-[#121614]">Free space</p>
            <p class="text-[15px] font-semibold text-[#121614]">{{ formatBytes(free) }}</p>
          </div>
          <div class="mt-3"><UiProgress :value="usedPercent" /></div>
          <p class="mt-2 text-[13px] text-[#606863]">
            The recommended AI needs about {{ formatBytes(recommendedBytes) }}.
          </p>
        </div>

        <div class="flex items-center gap-3 p-4 sm:p-5">
          <i class="fa-solid fa-microchip w-5 text-center text-[14px] text-[#606863]" aria-hidden="true"></i>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-medium text-[#121614]">Power</p>
            <p class="text-[13px] text-[#606863]">{{ powerNote }}</p>
          </div>
          <UiBadge :tone="roomy ? 'success' : 'muted'">{{ roomy ? 'Good' : 'Workable' }}</UiBadge>
        </div>

        <div class="flex items-center gap-3 p-4 sm:p-5">
          <i class="fa-solid fa-wand-magic-sparkles w-5 text-center text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
          <div class="min-w-0 flex-1">
            <p class="text-[15px] font-medium text-[#121614]">Best model for you</p>
            <p class="truncate text-[13px] text-[#606863]">
              {{ recommended?.label }} · {{ formatBytes(recommendedBytes) }} download
            </p>
          </div>
        </div>
      </div>
    </template>

    <template v-if="!scanning" #footer>
      <UiButton block size="lg" @click="$emit('next')">{{ deviceFit.action }}</UiButton>
    </template>
  </OnboardingShell>
</template>

<script setup>
import { detectDevice, recommendedModel, variantOn } from '~/lib/llm'
import { formatBytes, storageEstimate } from '~/lib/deviceStorage'
import { deviceChecks, deviceFit } from '~/data/onboarding'

defineEmits(['next'])

const done = ref(0)
const caps = shallowRef(null)
const storage = shallowRef(null)
let timer

const scanning = computed(() => done.value < deviceChecks.length)

const recommended = computed(() => (caps.value ? recommendedModel(caps.value) : null))
const recommendedBytes = computed(() =>
  caps.value && recommended.value ? variantOn(recommended.value, caps.value)?.downloadBytes ?? 0 : 0,
)

const free = computed(() => (storage.value ? Math.max(0, storage.value.quota - storage.value.usage) : 0))
const usedPercent = computed(() =>
  storage.value?.quota ? Math.min(100, Math.round((storage.value.usage / storage.value.quota) * 100)) : 0,
)

/** Enough room for the download with something to spare. */
const roomy = computed(() => !storage.value || free.value > recommendedBytes.value * 1.5)

const deviceLabel = computed(() => (caps.value?.phone ? 'This phone' : 'This computer'))

const powerNote = computed(() => {
  if (!caps.value) return ''
  if (caps.value.device === 'webgpu') return 'Uses the graphics chip, which answers faster'
  const threads = caps.value.threads ?? 1
  return `Uses the processor · ${threads} core${threads > 1 ? 's' : ''}`
})

// The checks are real; the pacing only keeps each line readable.
onMounted(async () => {
  caps.value = await detectDevice()
  done.value = 1
  storage.value = await storageEstimate()
  timer = setTimeout(() => { done.value = deviceChecks.length }, 700)
})

onBeforeUnmount(() => clearTimeout(timer))
</script>
