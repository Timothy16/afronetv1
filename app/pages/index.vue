<!-- app/pages/index.vue -->

<template>
  <div
    class="mx-auto flex min-h-[calc(100vh-14rem)] w-full max-w-3xl flex-col items-center justify-center px-5 py-16 sm:py-24"
  >
    <div class="rise w-full text-center">
      <h1
        class="font-['Instrument_Serif',Georgia,serif] text-[44px] leading-none tracking-tight text-[#121614] sm:text-[56px]"
      >
        Afronet
      </h1>
      <p class="mx-auto mt-3 max-w-md text-[14px] leading-relaxed text-[#606863]">The internet you can carry with you.</p>

      <div class="mt-9 sm:mt-10">
        <AiIntelBox autofocus @submit="ask" />
      </div>

      <div class="mt-4 flex flex-wrap items-center justify-center gap-2">
        <button
          v-for="p in suggestedPrompts"
          :key="p"
          class="rounded-full border border-[#e4e4de] px-3 py-1.5 text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
          @click="ask(p)"
        >
          {{ p }}
        </button>
      </div>
    </div>

    <nav aria-label="Pinned services" class="fade mt-14 grid w-full max-w-xl grid-cols-4 gap-2 sm:grid-cols-7">
      <button
        v-for="a in shortcuts"
        :key="a.id"
        class="group flex flex-col items-center gap-2 rounded-xl px-1 py-3 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
        @click="go(a.route)"
      >
        <span
          class="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4e4de]"
          :class="a.phase === 'v1' ? 'text-[#0b5d3e]' : 'text-[#606863]'"
        >
          <ShellAppIcon :name="a.icon" />
        </span>
        <span class="text-[11px] text-[#606863] group-hover:text-[#121614]">{{ a.name }}</span>
      </button>
    </nav>

    <div class="mt-16 flex flex-col items-center gap-3 text-center">
      <p class="text-[12px] text-[#8f9792]">
        <span :class="mode === 'offline' ? 'text-[#8f9792]' : 'text-[#0b5d3e]'">●</span>
        {{ modeCopy[mode].label }} · {{ modeCopy[mode].detail }}
      </p>
      <button
        class="inline-flex items-center gap-1.5 text-[12px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
        @click="go('/network')"
      >
        See what your device is sharing
        <i class="fa-solid fa-arrow-right text-[12px]" aria-hidden="true"></i>
      </button>
      <div class="mt-2 flex items-center gap-4 text-[11px] text-[#8f9792]">
        <button class="hover:text-[#121614]" @click="go('/welcome')">Onboarding</button>
        <button class="hover:text-[#121614]" @click="go('/system')">Design system</button>
        <button class="hover:text-[#121614]" @click="go('/settings')">Settings</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { apps } from '~/data/apps'
import { suggestedPrompts } from '~/data/conversations'
import { modeCopy } from '~/data/network'

const { pinned, mode } = useAfronet()

const shortcuts = computed(() =>
  pinned.value
    .map((id) => apps.find((a) => a.id === id))
    .filter(Boolean)
    .slice(0, 7),
)

// The prompt travels to the workspace in history state, as the design did
// with router state, so it never appears in the URL.
const ask = (value) => navigateTo({ path: '/workspace', state: { prompt: value } })

const go = (path) => navigateTo(path)
</script>

<style scoped>
.rise {
  animation: rise 0.28s cubic-bezier(0.23, 1, 0.32, 1) both;
}

.fade {
  animation: fade 0.3s cubic-bezier(0.23, 1, 0.32, 1) 0.08s both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .rise,
  .fade {
    animation: none;
  }
}
</style>
