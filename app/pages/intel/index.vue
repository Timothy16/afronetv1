<!-- app/pages/intel/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="Intelligence layer"
      title="AfroIntel Center"
      description="Afronet reads your hardware and recommends the largest model it can run well. Nothing downloads without your say."
    />

    <div class="mt-6 grid gap-5 lg:grid-cols-3">
      <UiCard class="p-5 lg:col-span-2">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-[11px] uppercase tracking-wide text-[#8f9792]">Your device</p>
            <h2 class="mt-1 text-[19px] font-semibold tracking-tight text-[#121614]">{{ device.name }}</h2>
          </div>
          <div class="text-right">
            <p class="text-[11px] text-[#8f9792]">AI capability</p>
            <span class="text-[12px] tracking-[0.15em] text-[#b07f15]" :aria-label="`${device.score} of 5`">
              {{ '★'.repeat(device.score) }}<span class="text-[#8f9792]">{{ '★'.repeat(5 - device.score) }}</span>
            </span>
          </div>
        </div>

        <dl class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div v-for="s in deviceStats" :key="s.k">
            <dt class="text-[11px] text-[#8f9792]">{{ s.k }}</dt>
            <dd class="mt-0.5 text-[13px] text-[#121614]">{{ s.v }}</dd>
          </div>
        </dl>

        <div class="mt-5 rounded-2xl bg-[#f7f7f4] p-4">
          <p class="text-[12px] text-[#606863]">Recommended for this device</p>
          <p class="mt-1 text-[15px] font-semibold text-[#121614]">AfroIntel Core</p>
          <p class="mt-1 text-[12px] text-[#606863]">
            Runs comfortably in 6 GB and keeps responses fast. Lite stays installed as a fallback.
          </p>
        </div>

        <div class="mt-5 grid gap-3 sm:grid-cols-2">
          <div>
            <p class="mb-2 text-[12px] font-medium text-[#121614]">Your device can run</p>
            <ul class="space-y-1.5 text-[13px] text-[#606863]">
              <li v-for="i in canRun" :key="i" class="flex items-center gap-2">
                <i class="fa-solid fa-check text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
                {{ i }}
              </li>
            </ul>
          </div>
          <div>
            <p class="mb-2 text-[12px] font-medium text-[#121614]">Not recommended</p>
            <ul class="space-y-1.5 text-[13px] text-[#606863]">
              <li v-for="i in notRecommended" :key="i" class="flex items-center gap-2">
                <i class="fa-solid fa-triangle-exclamation text-[12px] text-[#b07f15]" aria-hidden="true"></i>
                {{ i }}
              </li>
            </ul>
          </div>
        </div>
      </UiCard>

      <UiCard class="p-5">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-bolt text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
          <h3 class="text-[14px] font-semibold text-[#121614]">Nearby intelligence</h3>
        </div>
        <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
          {{ aiHotspot.model }} is being shared by {{ aiHotspot.owner }} one hop away. Use it without downloading
          anything.
        </p>
        <UiButton class="mt-4" block variant="secondary">Connect to {{ aiHotspot.model }}</UiButton>
        <div class="mt-5 divide-y divide-[#e4e4de] border-t border-[#e4e4de] pt-1">
          <UiRow label="Installed models" value="1" />
          <UiRow label="Model storage used" value="0.9 GB" />
          <UiRow label="Run models on" value="CPU" hint="No NPU detected" />
        </div>
      </UiCard>
    </div>

    <section class="mt-8">
      <UiSectionHeading title="Available models" hint="Every model runs entirely on device once downloaded." />
      <div class="mt-4 grid gap-4 md:grid-cols-2">
        <UiCard v-for="m in models" :key="m.id" class="flex flex-col p-5" interactive>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h3 class="text-[15px] font-semibold text-[#121614]">{{ m.name }}</h3>
              <p class="mt-0.5 text-[12px] text-[#606863]">{{ m.tier }} · {{ m.size }}</p>
            </div>
            <UiBadge v-if="m.state === 'installed'" tone="brand">
              <i class="fa-solid fa-check text-[10px]" aria-hidden="true"></i>
              Installed
            </UiBadge>
            <UiBadge v-else-if="m.state === 'downloading'" tone="gold">Downloading</UiBadge>
            <UiBadge v-else-if="m.state === 'unsupported'" tone="muted">Not supported</UiBadge>
            <UiBadge v-else tone="outline">Available</UiBadge>
          </div>

          <p class="mt-3 text-[13px] leading-relaxed text-[#606863]">{{ m.summary }}</p>

          <dl class="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
            <div v-for="s in modelStats(m)" :key="s.k">
              <dt class="text-[#8f9792]">{{ s.k }}</dt>
              <dd class="mt-0.5 text-[#121614]">{{ s.v }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-[11px] text-[#8f9792]">{{ m.languages }}</p>

          <div v-if="m.state === 'downloading'" class="mt-4">
            <p class="mb-1.5 flex justify-between text-[11px] text-[#606863]">
              <span>Downloading over Afronet</span>
              <span>{{ m.progress }}%</span>
            </p>
            <UiProgress :value="m.progress ?? 0" />
          </div>
          <UiButton
            v-else
            class="mt-auto"
            :variant="m.state === 'installed' ? 'secondary' : 'primary'"
            size="sm"
            :disabled="m.state === 'unsupported'"
            @click="open(m)"
          >
            <template v-if="m.state !== 'installed'" #icon>
              <i class="fa-solid fa-download text-[12px]" aria-hidden="true"></i>
            </template>
            {{ m.state === 'installed' ? 'Manage' : m.state === 'unsupported' ? 'Needs more memory' : 'Download' }}
          </UiButton>
        </UiCard>
      </div>
    </section>

    <UiModal
      :open="!!selected"
      :title="selected?.name ?? ''"
      :description="selected ? `${selected.tier} model · ${selected.size}` : ''"
      @close="selected = null"
    >
      <template v-if="selected">
        <!-- Compatibility and network choice -->
        <div v-if="progress === null" class="space-y-4">
          <div class="rounded-2xl border border-[#e4e4de] p-4">
            <UiRow label="Your device">
              <template #value>
                <UiBadge :tone="selected.state === 'unsupported' ? 'danger' : 'brand'">
                  {{ selected.state === 'unsupported' ? 'Not compatible' : 'Compatible' }}
                </UiBadge>
              </template>
            </UiRow>
            <UiRow label="RAM required" :value="selected.ram" />
            <UiRow label="Storage required" :value="selected.storage" />
            <UiRow label="Expected speed" :value="selected.speed" />
            <UiRow label="Languages" :value="selected.languages" />
          </div>

          <div>
            <p class="mb-2 text-[12px] font-medium text-[#121614]">Allow download over</p>
            <UiSegmentedControl
              v-model="net"
              :options="[
                { value: 'wifi', label: 'Wi-Fi only' },
                { value: 'afronet', label: 'Afronet' },
                { value: 'mobile', label: 'Mobile data' },
              ]"
            />
            <p class="mt-2 text-[11px] text-[#8f9792]">{{ netCopy[net] }}</p>
          </div>

          <UiButton block @click="startDownload">
            <template #icon><i class="fa-solid fa-download text-[14px]" aria-hidden="true"></i></template>
            Download {{ selected.name }}
          </UiButton>
        </div>

        <!-- Downloading -->
        <div v-else-if="progress < 100" class="py-4">
          <div class="mb-3 flex items-center gap-2 text-[13px] text-[#121614]">
            <i class="fa-solid fa-microchip text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
            Downloading {{ selected.name }}
          </div>
          <UiProgress :value="progress" />
          <p class="mt-2 flex justify-between text-[11px] text-[#8f9792]">
            <span>{{ net === 'afronet' ? 'From Polytechnic Node · 1 hop' : 'From Afronet gateway' }}</span>
            <span>{{ progress }}%</span>
          </p>
          <UiButton variant="ghost" size="sm" class="mt-4" @click="pause">Pause</UiButton>
        </div>

        <!-- Done -->
        <UiStatePanel
          v-else
          kind="success"
          :title="`${selected.name} is ready`"
          body="It runs entirely on this device. AfroIntel will use it automatically and fall back to Lite when the battery is low."
        >
          <template #icon><i class="fa-solid fa-hard-drive text-[18px]" aria-hidden="true"></i></template>
          <template #action>
            <UiButton size="sm" @click="selected = null">Done</UiButton>
          </template>
        </UiStatePanel>
      </template>
    </UiModal>
  </div>
</template>

<script setup>
import { device, models } from '~/data/models'
import { aiHotspot } from '~/data/network'

useHead({ title: 'AfroIntel Center — Afronet' })

const selected = ref(null)
// wifi | afronet | mobile
const net = ref('afronet')
const progress = ref(null)
let timer = null

const deviceStats = [
  { k: 'RAM', v: device.ram },
  { k: 'Storage free', v: device.free },
  { k: 'Processor', v: device.processor },
  { k: 'Battery', v: device.battery },
]

const canRun = ['AfroIntel Lite', 'AfroIntel Core', 'Education module', 'Language module']
const notRecommended = ['AfroIntel Pro — needs 12 GB RAM', 'Law module — 940 MB, low free space']

const netCopy = {
  afronet: 'Pulls from the Polytechnic Node nearby — no internet data used.',
  wifi: 'Waits for a Wi-Fi connection before starting.',
  mobile: 'Uses your mobile data allowance.',
}

const modelStats = (m) => [
  { k: 'RAM', v: m.ram },
  { k: 'Storage', v: m.storage },
  { k: 'Speed', v: m.speed },
  { k: 'Capability', v: '★'.repeat(m.capability) },
]

const stopTimer = () => {
  if (timer) window.clearInterval(timer)
  timer = null
}

const open = (m) => {
  stopTimer()
  selected.value = m
  progress.value = null
}

// Simulated download: 4% every 120ms.
const startDownload = () => {
  stopTimer()
  progress.value = 0
  timer = window.setInterval(() => {
    if (progress.value === null) return stopTimer()
    if (progress.value >= 100) {
      progress.value = 100
      return stopTimer()
    }
    progress.value = Math.min(100, progress.value + 4)
  }, 120)
}

const pause = () => {
  stopTimer()
  progress.value = null
}

onBeforeUnmount(stopTimer)
</script>
