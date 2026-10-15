<!-- app/components/Ai/SetupCard.vue -->

<!-- One-time download, startup, interrupted / unsupported / error states for the on-device model. -->
<template>
  <section class="mx-auto w-full max-w-md rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-6" aria-live="polite">
    <template v-if="status === 'detecting'">
      <p class="text-[13px] text-[#606863]">Checking your device…</p>
    </template>

    <template v-else-if="status === 'unsupported'">
      <h2 class="font-['Instrument_Serif',Georgia,serif] text-[24px] leading-tight text-[#121614]">
        Not supported on this device yet
      </h2>
      <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
        AfroIntel runs on your device, and this browser doesn't provide what it needs. Try an
        up-to-date Chrome, Edge or Samsung Internet on Android, or Safari on iOS 26 or later.
      </p>
    </template>

    <template v-else-if="status === 'needs-download'">
      <h2 class="font-['Instrument_Serif',Georgia,serif] text-[24px] leading-tight text-[#121614]">
        {{ heading }}
      </h2>
      <p v-if="evicted" class="mt-2 text-[13px] leading-relaxed text-[#606863]">
        Your device cleared AfroIntel to free up space, which phones do when storage runs low.
        Downloading it again brings everything back; your chats were never affected.
      </p>
      <p v-else-if="interrupted" class="mt-2 text-[13px] leading-relaxed text-[#606863]">
        Setup didn't finish last time. Anything already downloaded is kept, so this continues where
        it stopped.
      </p>
      <p v-else class="mt-2 text-[13px] leading-relaxed text-[#606863]">
        AfroIntel answers on your device, so it keeps working without the internet. It needs a
        one-time download of about <span class="font-medium text-[#121614]">{{ size }}</span>.
      </p>
      <p class="mt-1.5 text-[12px] text-[#8f9792]">Use Wi-Fi if you can. After this, no data is needed to chat.</p>

      <p v-if="space && !space.ok" class="mt-3 rounded-xl bg-[#f7f7f4] p-3 text-[12px] leading-relaxed text-[#606863]">
        This device has about <span class="font-medium text-[#121614]">{{ formatBytes(space.free) }}</span>
        free and AfroIntel needs about <span class="font-medium text-[#121614]">{{ formatBytes(space.needed) }}</span>.
        Free some space first, or the download will stop partway.
      </p>

      <UiButton block class="mt-5" :disabled="!online" @click="load()">
        {{ interrupted || evicted ? 'Continue' : 'Download' }} ({{ size }})
      </UiButton>
      <p v-if="!online" class="mt-2 text-center text-[12px] text-[#b22c26]">
        You're offline. Connect to the internet to download.
      </p>
    </template>

    <template v-else-if="status === 'cached'">
      <!-- Only shown when auto-start is held back after an interrupted setup. -->
      <h2 class="font-['Instrument_Serif',Georgia,serif] text-[24px] leading-tight text-[#121614]">
        AfroIntel stopped while starting
      </h2>
      <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
        Last time, your device closed Afronet before the AI finished starting. That usually means it
        was low on memory. Close other apps and tabs, then try again — nothing needs downloading.
      </p>
      <UiButton block class="mt-5" @click="load()">Start AfroIntel</UiButton>
    </template>

    <template v-else-if="status === 'loading'">
      <h2 class="font-['Instrument_Serif',Georgia,serif] text-[24px] leading-tight text-[#121614]">
        {{ starting ? 'Starting AfroIntel…' : 'Downloading…' }}
      </h2>

      <template v-if="starting">
        <p class="mt-2 text-[13px] text-[#606863]">Preparing the AI on your device. This can take a little while on phones.</p>
        <div class="mt-4 h-2 overflow-hidden rounded-full bg-[#e4e4de]">
          <span class="indeterminate block h-full w-1/3 rounded-full bg-[#0b5d3e]" />
        </div>
        <p v-if="elapsed >= 5" class="mt-2 text-[12px] text-[#8f9792]">{{ elapsed }}s</p>
      </template>

      <template v-else>
        <div
          class="mt-4 h-2 overflow-hidden rounded-full bg-[#e4e4de]"
          role="progressbar"
          :aria-valuenow="percent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <span
            class="block h-full rounded-full bg-[#0b5d3e] transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
            :style="{ width: `${percent}%` }"
          />
        </div>
        <p class="mt-2 text-[13px] text-[#606863]">
          <template v-if="progress">
            {{ formatBytes(progress.loaded) }} of {{ formatBytes(progress.total) }} · {{ percent }}%
          </template>
          <template v-else>Starting download…</template>
        </p>
        <p class="mt-1 text-[12px] text-[#8f9792]">Keep this screen open until it finishes.</p>
      </template>
    </template>

    <template v-else-if="status === 'error'">
      <h2 class="font-['Instrument_Serif',Georgia,serif] text-[24px] leading-tight text-[#121614]">
        Something went wrong
      </h2>
      <p class="mt-2 break-words text-[13px] leading-relaxed text-[#b22c26]">{{ error }}</p>
      <p v-if="!online" class="mt-2 text-[12px] text-[#8f9792]">
        You're offline. If the download didn't finish, reconnect and try again — finished files are kept.
      </p>
      <UiButton block class="mt-5" @click="load()">Try again</UiButton>
    </template>
  </section>
</template>

<script setup>
import { formatBytes } from '~/lib/deviceStorage'

const { status, info, progress, fromCache, initStartedAt, interrupted, evicted, error, load, spaceCheck } = useLLM()
const online = useOnline()

const heading = computed(() => {
  if (evicted.value) return 'AfroIntel needs downloading again'
  return interrupted.value ? 'Finish setting up' : 'Set up AfroIntel'
})

// Checked before offering the download: running out of space mid-download is the most common
// way this fails on a phone.
const space = ref(null)
watch(status, async (value) => {
  if (value === 'needs-download') space.value = await spaceCheck()
}, { immediate: true })

const size = computed(() => formatBytes(info.value?.downloadBytes ?? 0))
const percent = computed(() => Math.floor(progress.value?.percent ?? 0))
const starting = computed(() => status.value === 'loading' && (progress.value?.phase === 'init' || fromCache.value))

// Elapsed seconds while starting, so a slow phone looks busy rather than frozen.
//
// The clock is read when the counter starts rather than when the component is set up. Setup
// runs on the server and again in the browser, at two different moments, so a clock read there
// gives two different answers for the same render.
const now = ref(0)
let timer
watch(starting, (on) => {
  clearInterval(timer)
  if (!on || !import.meta.client) return
  now.value = Date.now()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
}, { immediate: true })
onBeforeUnmount(() => clearInterval(timer))

const elapsed = computed(() =>
  initStartedAt.value ? Math.max(0, Math.round((now.value - initStartedAt.value) / 1000)) : 0,
)
</script>

<style scoped>
.indeterminate {
  animation: slide 1.4s ease-in-out infinite;
}

@keyframes slide {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(300%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .indeterminate {
    animation: none;
    width: 100%;
    opacity: 0.5;
  }
}
</style>
