<!-- app/components/Shell/ConnectivityPill.vue -->

<template>
  <div class="relative">
    <button
      :aria-expanded="open ? 'true' : 'false'"
      aria-label="Afronet connection status"
      class="flex items-center gap-2 rounded-full border border-[#e4e4de] bg-[#ffffff] px-3 py-1.5 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
      @click="open = !open"
    >
      <span class="relative flex h-2 w-2 items-center justify-center">
        <span class="h-2 w-2 rounded-full" :class="dot" />
        <span v-if="mode !== 'offline'" class="absolute h-2 w-2 animate-ping rounded-full opacity-40" :class="dot" />
      </span>
      <span class="hidden text-[12px] font-medium leading-tight text-[#121614] sm:block">
        {{ copy.label }}
        <span v-if="!compact" class="block text-[11px] font-normal text-[#8f9792]">
          {{ syncing ? 'Synchronising…' : copy.detail }}
        </span>
      </span>
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
        class="absolute right-0 z-40 mt-2 w-72 rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-2 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)]"
      >
        <p class="px-3 pb-2 pt-2 text-[11px] font-medium uppercase tracking-wide text-[#8f9792]">Simulate connection</p>
        <button
          v-for="m in modeOrder"
          :key="m"
          class="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
          @click="choose(m)"
        >
          <i
            class="fa-solid fa-tower-broadcast mt-0.5 text-[14px]"
            :class="m === 'offline' ? 'text-[#8f9792]' : 'text-[#0b5d3e]'"
            aria-hidden="true"
          ></i>
          <span class="min-w-0 flex-1">
            <span class="block text-[13px] font-medium text-[#121614]">{{ modeCopy[m].label }}</span>
            <span class="block text-[12px] text-[#606863]">{{ modeCopy[m].detail }}</span>
          </span>
          <i v-if="mode === m" class="fa-solid fa-check mt-0.5 text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
        </button>
        <p class="border-t border-[#e4e4de] px-3 pb-1 pt-3 text-[11px] leading-relaxed text-[#8f9792]">
          Afronet never reports “no internet” as a failure. Services degrade to what the current path can carry.
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { modeCopy, modeOrder } from '~/data/network'

defineProps({
  compact: { type: Boolean, default: false },
})

const { mode, setMode, syncing } = useAfronet()
const open = ref(false)

const copy = computed(() => modeCopy[mode.value])

const dot = computed(() =>
  copy.value.tone === 'brand' ? 'bg-[#0b5d3e]' : copy.value.tone === 'gold' ? 'bg-[#b07f15]' : 'bg-[#8f9792]',
)

const choose = (m) => {
  setMode(m)
  open.value = false
}
</script>
