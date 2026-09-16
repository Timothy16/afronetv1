<!-- app/components/Workspace/WindowFrame.vue -->

<template>
  <section
    v-if="app"
    :aria-label="`${app.name} window`"
    class="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[#e4e4de] bg-[#ffffff] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]"
  >
    <header class="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-[#e4e4de] px-3">
      <div class="flex min-w-0 items-center gap-2">
        <span class="flex h-6 w-6 items-center justify-center rounded-md bg-[#eaf3ee] text-[#0b5d3e]">
          <ShellAppIcon :name="app.icon" size="sm" />
        </span>
        <span class="truncate text-[13px] font-medium text-[#121614]">{{ app.name }}</span>
        <UiComingSoon v-if="app.phase !== 'v1'" />
      </div>
      <div class="flex items-center gap-0.5">
        <UiIconButton label="Ask AfroIntel about this app" size="sm" @click="emit('ask', app.name)">
          <i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i>
        </UiIconButton>
        <UiIconButton
          :label="isPinned ? 'Unpin from home' : 'Pin to home'"
          size="sm"
          :tone="isPinned ? 'brand' : 'default'"
          @click="togglePin(app.id)"
        >
          <i class="fa-solid fa-thumbtack text-[12px]" aria-hidden="true"></i>
        </UiIconButton>
        <UiIconButton
          :label="splitView ? 'Exit split screen' : 'Split screen'"
          size="sm"
          :tone="splitView ? 'brand' : 'default'"
          @click="setSplitView(!splitView)"
        >
          <i class="fa-solid fa-table-columns text-[12px]" aria-hidden="true"></i>
        </UiIconButton>
        <UiIconButton label="Minimise" size="sm" @click="minimizeApp(app.id)">
          <i class="fa-solid fa-minus text-[12px]" aria-hidden="true"></i>
        </UiIconButton>
        <UiIconButton label="Close" size="sm" @click="closeApp(app.id)">
          <i class="fa-solid fa-xmark text-[12px]" aria-hidden="true"></i>
        </UiIconButton>
      </div>
    </header>
    <div class="afro-scroll min-h-0 flex-1 overflow-y-auto">
      <slot />
    </div>
  </section>
</template>

<script setup>
import { findApp } from '~/data/apps'

const props = defineProps({
  appId: { type: String, required: true },
})

const emit = defineEmits(['ask'])

const { closeApp, minimizeApp, splitView, setSplitView, togglePin, pinned } = useAfronet()

const app = computed(() => findApp(props.appId))
const isPinned = computed(() => pinned.value.includes(props.appId))
</script>
