<!-- app/components/Studio/Nav.vue -->

<!--
  The Studio sidebar's contents: the one action that matters, the sections, and what is
  left of this month's AI quota. Shared by the fixed sidebar and the phone drawer so the
  two can never drift apart.

  The quota sits at the bottom on purpose. It is the one number a developer needs to see
  before they start describing an app, not after.
-->
<template>
  <div class="flex h-full flex-col">
    <UiButton block to="/studio/create" @click="emit('navigate')">
      <template #icon><i class="fa-solid fa-plus text-[11px]" aria-hidden="true"></i></template>
      Create an app
    </UiButton>

    <ul class="mt-4 flex-1 space-y-0.5">
      <li v-for="n in studioNav" :key="n.to">
        <NuxtLink
          :to="n.to"
          class="flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="
            isActive(n)
              ? 'bg-[#ffffff]/10 text-[#ffffff]'
              : 'text-[#ffffff]/60 hover:bg-[#ffffff]/5 hover:text-[#ffffff]'
          "
          @click="emit('navigate')"
        >
          <i class="fa-solid w-4 text-center text-[13px]" :class="n.icon" aria-hidden="true"></i>
          {{ n.label }}
        </NuxtLink>
      </li>
    </ul>

    <div class="space-y-3 border-t border-[#ffffff]/10 pt-4">
      <div class="px-1">
        <div class="flex items-center justify-between text-[11.5px] text-[#ffffff]/50">
          <span>AI generations this month</span>
          <span>{{ creditsLeft }} left</span>
        </div>
        <div class="mt-1.5 h-1 overflow-hidden rounded-full bg-[#ffffff]/10">
          <div class="h-full rounded-full bg-[#0b5d3e]" :style="{ width: `${usedPct}%` }" />
        </div>
      </div>

      <div class="flex items-center gap-2.5 px-1">
        <UiAvatar :name="name" :size="32" />
        <div class="min-w-0">
          <p class="truncate text-[13px] font-medium text-[#ffffff]">{{ name }}</p>
          <p v-if="handle" class="truncate text-[11.5px] text-[#ffffff]/50">@{{ handle }}</p>
        </div>
      </div>

      <!-- Out of the Studio and back to the shell. A full page load: /chat is isolated. -->
      <a
        href="/chat"
        class="flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium text-[#ffffff]/60 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#ffffff]/5 hover:text-[#ffffff]"
      >
        <i class="fa-solid fa-comment-dots w-4 text-center text-[12px]" aria-hidden="true"></i>
        AfroIntel
      </a>
    </div>
  </div>
</template>

<script setup>
import { studioNav } from '~/data/studio'

const { name, handle } = useStoreUser()

const emit = defineEmits(['navigate'])

const { credits, creditsLeft } = useStudio()

const route = useRoute()

const isActive = (n) => (n.exact ? route.path === n.to : route.path.startsWith(n.to))

const usedPct = computed(() => Math.round((credits.value.used / Math.max(1, credits.value.limit)) * 100))
</script>
