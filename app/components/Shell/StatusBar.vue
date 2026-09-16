<!-- app/components/Shell/StatusBar.vue -->

<template>
  <footer
    class="hidden h-9 shrink-0 items-center justify-between border-t border-[#e4e4de] bg-[#ffffff] px-4 text-[11px] text-[#606863] md:flex"
  >
    <div class="flex items-center gap-5">
      <NuxtLink to="/network" class="flex items-center gap-1.5 hover:text-[#121614]">
        <i class="fa-solid fa-tower-broadcast text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
        {{
          mode === 'offline'
            ? 'Afronet radio idle · searching for peers'
            : `${meshDevices.length} devices reachable · ${direct} direct`
        }}
      </NuxtLink>
      <NuxtLink to="/intel" class="flex items-center gap-1.5 hover:text-[#121614]">
        <i class="fa-solid fa-microchip text-[12px]" aria-hidden="true"></i>
        AfroIntel Lite · on device
      </NuxtLink>
      <NuxtLink to="/intel" class="flex items-center gap-1.5 hover:text-[#121614]">
        <i class="fa-solid fa-download text-[12px]" aria-hidden="true"></i>
        AfroIntel Core 78%
      </NuxtLink>
    </div>
    <div class="flex items-center gap-4">
      <span>{{ modeCopy[mode].detail }}</span>
      <button
        class="flex items-center gap-1.5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
        @click="startSync"
      >
        <i class="fa-solid fa-arrows-rotate text-[12px]" :class="syncing ? 'animate-spin' : ''" aria-hidden="true"></i>
        {{ syncing ? 'Synchronising' : 'Sync now' }}
      </button>
    </div>
  </footer>
</template>

<script setup>
import { meshDevices, modeCopy } from '~/data/network'

const { mode, syncing, startSync } = useAfronet()

const direct = meshDevices.filter((d) => d.hops === 1).length
</script>
