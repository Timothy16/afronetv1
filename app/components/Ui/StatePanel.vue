<!-- app/components/Ui/StatePanel.vue -->

<!-- Empty, offline, error, success and permission states. Pass the `icon` slot to override the default glyph. -->
<template>
  <div
    class="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#e4e4de] px-6 py-14 text-center"
  >
    <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-full" :class="tone">
      <slot name="icon">
        <i v-if="fallbackIcon" class="fa-solid text-[18px]" :class="fallbackIcon" aria-hidden="true"></i>
      </slot>
    </div>
    <p class="text-[15px] font-semibold text-[#121614]">{{ title }}</p>
    <p class="mt-1.5 max-w-sm text-[13px] leading-relaxed text-[#606863]">{{ body }}</p>
    <div v-if="$slots.action" class="mt-5">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  // empty | offline | error | success | permission
  kind: { type: String, default: 'empty' },
  title: { type: String, required: true },
  body: { type: String, required: true },
})

const fallbackIcon = computed(
  () =>
    ({
      offline: 'fa-link-slash',
      error: 'fa-triangle-exclamation',
      success: 'fa-circle-check',
    })[props.kind] ?? '',
)

const tone = computed(() =>
  props.kind === 'error'
    ? 'bg-[#b22c26]/10 text-[#b22c26]'
    : props.kind === 'success'
      ? 'bg-[#147a4c]/10 text-[#147a4c]'
      : 'bg-[#eaf3ee] text-[#0b5d3e]',
)
</script>
