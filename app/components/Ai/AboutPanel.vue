<!-- app/components/Ai/AboutPanel.vue -->

<!--
  What is installed on this device and how much room it uses: the first thing to ask for when a
  phone misbehaves. Also carries the diagnostic log and the licence credits.
-->
<template>
  <div class="relative">
    <button
      type="button"
      aria-label="About the AI on this device"
      title="About"
      class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
      @click="toggle"
    >
      <AiIcon name="info" :size="18" />
    </button>

    <div v-if="open" class="fixed inset-0 z-30" @click="open = false" />

    <Transition
      enter-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="-translate-y-1.5 scale-[0.98] opacity-0"
      leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-to-class="-translate-y-1 scale-[0.98] opacity-0"
    >
      <div
        v-if="open"
        class="absolute right-0 top-full z-40 mt-1 w-[20rem] rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-4 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)]"
      >
        <p class="text-[13px] font-medium text-[#121614]">AfroIntel on this device</p>

        <dl class="mt-2 space-y-1 text-[12px]">
          <div v-for="row in rows" :key="row.k" class="flex gap-2">
            <dt class="w-28 shrink-0 text-[#8f9792]">{{ row.k }}</dt>
            <dd class="min-w-0 flex-1 break-words text-[#121614]">{{ row.v }}</dd>
          </div>
        </dl>

        <p v-if="iosHint" class="mt-3 rounded-lg bg-[#f7f7f4] p-2 text-[11px] leading-relaxed text-[#606863]">
          To keep Afronet on your home screen, use Share, then "Add to Home Screen". The AI is
          downloaded again there, because an installed app has its own storage.
        </p>

        <div class="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-full border border-[#e4e4de] px-3 py-1 text-[12px] text-[#121614] hover:bg-[#f7f7f4]"
            @click="copy"
          >
            {{ copied ? 'Copied' : 'Copy diagnostics' }}
          </button>
          <button
            v-if="canInstall"
            type="button"
            class="rounded-full border border-[#0b5d3e] px-3 py-1 text-[12px] font-medium text-[#0b5d3e] hover:bg-[#eaf3ee]/60"
            @click="install"
          >
            Install app
          </button>
        </div>

        <p class="mt-3 border-t border-[#e4e4de] pt-2 text-[11px] leading-relaxed text-[#8f9792]">
          The AI answers on this device. SmolLM2 by Hugging Face (Apache 2.0), transformers.js
          (Apache 2.0), ONNX Runtime (MIT), Inter and Instrument Serif (Open Font License).
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { getLog } from '~/lib/crashlog'
import { formatBytes } from '~/lib/deviceStorage'

const { model, info, caps, status, storage, persisted } = useLLM()

const open = ref(false)
const copied = ref(false)
const { $pwa } = useNuxtApp()

const canInstall = computed(() => Boolean($pwa?.showInstallPrompt) && !$pwa?.isPWAInstalled)
// iPhones never show an install prompt; they need the Share menu instead.
const iosHint = computed(() => Boolean(caps.value?.webkit) && !$pwa?.isPWAInstalled)

const rows = computed(() => {
  const threads = caps.value?.threads ?? 1
  const out = [
    { k: 'Model', v: `${model.value?.label ?? '—'}${status.value === 'ready' ? '' : ` (${status.value})`}` },
    { k: 'Runs on', v: info.value?.device === 'webgpu' ? 'graphics chip' : `processor · ${threads} core${threads > 1 ? 's' : ''}` },
    { k: 'Multi-core', v: typeof self !== 'undefined' && self.crossOriginIsolated ? 'enabled' : 'not available' },
  ]
  if (storage.value) {
    const free = Math.max(0, storage.value.quota - storage.value.usage)
    out.push({ k: 'Storage used', v: `${formatBytes(storage.value.usage)} · ${formatBytes(free)} free` })
  }
  out.push({ k: 'Kept by device', v: persisted.value === null ? 'unknown' : persisted.value ? 'yes' : 'not guaranteed' })
  return out
})

const toggle = () => { open.value = !open.value }

const copy = async () => {
  try {
    await navigator.clipboard.writeText(getLog().join('\n'))
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch { /* clipboard blocked */ }
}

const install = async () => {
  await $pwa?.install?.()
  open.value = false
}
</script>
