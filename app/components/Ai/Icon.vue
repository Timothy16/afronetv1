<!-- app/components/Ai/Icon.vue -->

<!--
  Inline SVG icons for the AI chat surface. The rest of the app uses Font Awesome from a CDN,
  which a cross-origin isolated page (/chat, needed for multi-threaded WASM) cannot load — and
  which would also be missing offline. Icons here are drawn in the page instead.
-->
<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="shrink-0"
  >
    <path v-for="(d, i) in paths" :key="i" :d="d" />
    <circle v-for="(c, i) in circles" :key="`c${i}`" :cx="c[0]" :cy="c[1]" :r="c[2]" />
    <rect v-if="rect" :x="rect[0]" :y="rect[1]" :width="rect[2]" :height="rect[3]" :rx="rect[4]" />
  </svg>
</template>

<script setup>
const props = defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 18 },
  strokeWidth: { type: Number, default: 1.8 },
})

// Minimal 24×24 stroke icons. Each entry: paths, optional circles [cx, cy, r], optional rect.
const ICONS = {
  plus: { paths: ['M12 5v14', 'M5 12h14'] },
  send: { paths: ['M12 19V5', 'M5 12l7-7 7 7'] },
  stop: { rect: [6, 6, 12, 12, 2] },
  mic: { paths: ['M12 19v3', 'M19 11a7 7 0 0 1-14 0', 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z'] },
  copy: { paths: ['M9 9h10v10H9z', 'M5 15V5h10'] },
  refresh: { paths: ['M20 11a8 8 0 1 0-1.6 5.6', 'M20 5v6h-6'] },
  check: { paths: ['M20 6 9 17l-5-5'] },
  close: { paths: ['M18 6 6 18', 'M6 6l12 12'] },
  back: { paths: ['M19 12H5', 'M12 19l-7-7 7-7'] },
  menu: { paths: ['M4 7h16', 'M4 12h16', 'M4 17h10'] },
  chevron: { paths: ['M6 9l6 6 6-6'] },
  info: { paths: ['M12 11v6', 'M12 7.5v.01'], circles: [[12, 12, 9]] },
  signout: { paths: ['M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4', 'M16 17l5-5-5-5', 'M21 12H9'] },
  download: { paths: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 20h16'] },
  device: { paths: ['M9 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M11 18h2'] },
  offline: { paths: ['M3 3l18 18', 'M8.5 16.5a5 5 0 0 1 7 0', 'M5 13a10 10 0 0 1 4-2.5', 'M19 13a10 10 0 0 0-7-3'] },
  warning: { paths: ['M12 3 2 20h20L12 3z', 'M12 10v4', 'M12 17.5v.01'] },
}

const icon = computed(() => ICONS[props.name] ?? ICONS.check)
const paths = computed(() => icon.value.paths ?? [])
const circles = computed(() => icon.value.circles ?? [])
const rect = computed(() => icon.value.rect ?? null)
</script>
