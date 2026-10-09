<!-- app/components/Onboarding/ModelChoice.vue -->

<!--
  Screen 4 — the models this app really offers, with the one that suits this device raised above
  the rest. Sizes are what this device would actually download, and a model already on the device
  says so instead of offering a download.

  A model this device cannot run is still listed, marked, and cannot be picked: hiding it would
  leave people wondering what they are missing.
-->
<template>
  <OnboardingShell>
    <template #header>
      <NuxtLink to="/" aria-label="Afronet home">
        <BrandMark :size="32" />
      </NuxtLink>
    </template>

    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614] sm:text-[30px]">
      {{ modelChoice.title }}
    </h1>
    <p class="mt-2.5 text-[15px] leading-relaxed text-[#606863]">{{ modelChoice.body }}</p>

    <p v-if="!options.length" class="mt-6 text-[14px] text-[#606863]">Checking what this device can run…</p>

    <!-- the recommendation -->
    <button
      v-if="recommended"
      type="button"
      class="mt-6 w-full rounded-2xl border-2 p-5 text-left transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="selected === recommended.spec.key ? 'border-[#0b5d3e] bg-[#eaf3ee]/40' : 'border-[#e4e4de] hover:border-[#0b5d3e]/50'"
      :aria-pressed="selected === recommended.spec.key"
      @click="selected = recommended.spec.key"
    >
      <span class="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0b5d3e]">
        <i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i>
        {{ modelChoice.recommendedLabel }}
      </span>
      <span class="mt-2 block text-[20px] font-semibold tracking-tight text-[#121614]">{{ recommended.spec.label }}</span>
      <span class="mt-1 block text-[14px] leading-relaxed text-[#606863]">{{ summaryFor(recommended) }}</span>

      <dl class="mt-5 grid grid-cols-2 gap-x-4 gap-y-4">
        <div v-for="stat in statsFor(recommended)" :key="stat.label">
          <dt class="text-[12px] font-medium text-[#606863]">{{ stat.label }}</dt>
          <dd class="mt-1 text-[14px] font-semibold text-[#121614]">{{ stat.value }}</dd>
        </div>
      </dl>
    </button>

    <!-- everything else -->
    <div v-if="others.length" class="mt-8">
      <UiSectionHeading :title="modelChoice.othersLabel" :hint="`${options.length} available`" />
      <div class="mt-3 divide-y divide-[#e4e4de] overflow-hidden rounded-2xl border border-[#e4e4de]">
        <button
          v-for="option in others"
          :key="option.spec.key"
          type="button"
          class="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="[
            option.runnable ? 'hover:bg-[#f7f7f4]' : 'cursor-not-allowed opacity-60',
            selected === option.spec.key ? 'bg-[#eaf3ee]/50' : '',
          ]"
          :disabled="!option.runnable"
          :aria-pressed="selected === option.spec.key"
          @click="selected = option.spec.key"
        >
          <span class="min-w-0 flex-1">
            <span class="block text-[15px] font-semibold text-[#121614]">{{ option.spec.label }}</span>
            <span class="mt-0.5 block text-[13px] text-[#606863]">{{ lineFor(option) }}</span>
          </span>
          <UiBadge v-if="!option.runnable" tone="muted">Not supported here</UiBadge>
          <UiBadge v-else-if="option.cached" tone="success">On this device</UiBadge>
          <i
            v-else-if="selected === option.spec.key"
            class="fa-solid fa-circle-check text-[15px] text-[#0b5d3e]"
            aria-hidden="true"
          ></i>
        </button>
      </div>
    </div>

    <template #footer>
      <UiButton block size="lg" :disabled="!chosen" @click="$emit('download', selected)">
        {{ actionLabel }}
      </UiButton>
      <button
        type="button"
        class="text-center text-[13px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
        @click="$emit('skip')"
      >
        {{ modelChoice.skip }}
      </button>
    </template>
  </OnboardingShell>
</template>

<script setup>
import { formatBytes } from '~/lib/deviceStorage'
import { modelChoice } from '~/data/onboarding'

defineEmits(['download', 'skip'])

const { modelOptions, caps } = useLLM()

const options = ref([])
const selected = ref('')

const recommended = computed(() => options.value.find(o => o.recommended) ?? options.value[0] ?? null)
const others = computed(() => options.value.filter(o => o !== recommended.value))
const chosen = computed(() => options.value.find(o => o.spec.key === selected.value) ?? null)

const actionLabel = computed(() => {
  if (!chosen.value) return modelChoice.action
  if (chosen.value.cached) return `Use ${chosen.value.spec.label}`
  if (chosen.value === recommended.value) return modelChoice.action
  return `Download ${chosen.value.spec.label}`
})

const lineFor = (option) => {
  const where = option.spec.recommendedFor === 'phones' ? 'Smaller' : 'Larger'
  if (!option.runnable) return `${where} · not supported on this device`
  return option.cached ? `${where} · already downloaded` : `${where} · ${formatBytes(option.downloadBytes)} download`
}

const summaryFor = (option) =>
  option.spec.recommendedFor === 'phones'
    ? 'Small and quick to download. Good everyday answers, and comfortable on a phone.'
    : 'Larger and slower to download, with stronger answers. Best on a computer with a graphics chip.'

const statsFor = (option) => [
  { label: 'Download', value: option.cached ? 'Already here' : formatBytes(option.downloadBytes) },
  { label: 'Runs on', value: caps.value?.device === 'webgpu' ? 'Graphics chip' : 'Processor' },
  { label: 'Best for', value: option.spec.recommendedFor === 'phones' ? 'Phones' : 'Computers' },
  { label: 'Offline', value: 'Works offline' },
]

onMounted(async () => {
  const all = await modelOptions()
  // `current` is what the engine would start today — the per-device recommendation.
  options.value = all.map(o => ({ ...o, recommended: o.current }))
  selected.value = (options.value.find(o => o.recommended) ?? options.value.find(o => o.runnable))?.spec.key ?? ''
})
</script>
