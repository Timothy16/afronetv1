<!-- app/components/Onboarding/ModelDownload.vue -->

<!--
  Screen 5 — the real download, not a simulation.

  It reports the bytes the engine has actually fetched, which is the number that matters on a
  metered connection. Files already on the device are skipped, so an interrupted download
  continues rather than starting again.

  There is no pause: the fetch either runs or is retried. "Continue without it" leaves the
  download for the chat page, which offers the same setup.

  Emits `done` when the files are on the device.
-->
<template>
  <OnboardingShell>
    <template #header>
      <BrandMark :size="32" />
    </template>

    <div class="flex min-h-[55vh] flex-col items-center justify-center text-center">
      <div class="relative grid h-40 w-40 place-items-center">
        <svg class="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#f7f7f4" stroke-width="6" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            :stroke="failed ? '#b22c26' : '#0b5d3e'"
            stroke-width="6"
            stroke-linecap="round"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="circumference * (1 - percent / 100)"
            class="transition-[stroke-dashoffset] duration-200 ease-out"
          />
        </svg>
        <div
          class="relative text-center"
          role="progressbar"
          :aria-valuenow="percent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <p class="text-[34px] font-semibold tabular-nums leading-none text-[#121614]">{{ percent }}%</p>
          <p class="mt-1.5 text-[13px] font-medium text-[#606863]">{{ phaseLabel }}</p>
        </div>
      </div>

      <h1 class="mt-7 text-[20px] font-semibold tracking-tight text-[#121614]">{{ label }}</h1>
      <p v-if="progress" class="mt-1 text-[15px] tabular-nums text-[#606863]">
        {{ formatBytes(progress.loaded) }} of {{ formatBytes(progress.total) }}
      </p>

      <p v-if="failed" class="mt-5 max-w-sm text-[13px] leading-relaxed text-[#b22c26]">{{ downloadError }}</p>
      <p v-else class="mt-6 max-w-sm text-[13px] leading-relaxed text-[#606863]">{{ modelDownload.body }}</p>
    </div>

    <template #footer>
      <UiButton v-if="failed" block size="lg" @click="run">{{ modelDownload.retry }}</UiButton>
      <button
        type="button"
        class="text-center text-[13px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
        @click="$emit('skip')"
      >
        {{ modelDownload.skip }}
      </button>
    </template>
  </OnboardingShell>
</template>

<script setup>
import { formatBytes } from '~/lib/deviceStorage'
import { modelDownload } from '~/data/onboarding'

const props = defineProps({
  // Falls back to whatever the engine would start on this device.
  modelId: { type: String, default: '' },
})

const emit = defineEmits(['done', 'skip'])

const { downloadModel, downloading, downloadProgress: progress, downloadError, model } = useLLM()

const circumference = 2 * Math.PI * 46

const failed = computed(() => Boolean(downloadError.value) && !downloading.value)
const percent = computed(() => Math.min(100, Math.floor(progress.value?.percent ?? 0)))
const label = computed(() => model.value?.label ?? 'African Intelligence')

const phaseLabel = computed(() => {
  if (failed.value) return 'Stopped'
  if (!progress.value) return 'Starting'
  return percent.value >= 100 ? 'Finishing' : 'Downloading'
})

const run = async () => {
  const ok = await downloadModel(props.modelId || undefined)
  if (ok) emit('done')
}

onMounted(run)
</script>
