<!-- app/components/Runtime/Message.vue -->

<!--
  Everything the runtime says when it cannot show the app: not installed, purchase
  unverified, no connection, a permission to answer. Each one is a full-frame message with
  the buttons that resolve it, rather than an error on top of a broken screen.
-->
<template>
  <div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
    <span
      class="flex h-12 w-12 items-center justify-center rounded-2xl"
      :class="tone === 'danger' ? 'bg-[#b22c26]/10 text-[#b22c26]' : 'bg-[#f7f7f4] text-[#606863]'"
    >
      <i class="fa-solid text-[20px]" :class="icon" aria-hidden="true"></i>
    </span>
    <p class="mt-3 text-[16px] font-semibold text-[#121614]">{{ title }}</p>
    <p class="mt-1 max-w-xs text-[13px] leading-relaxed text-[#606863]">{{ body }}</p>
    <div v-if="$slots.actions" class="mt-5 flex flex-wrap justify-center gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  title: { type: String, required: true },
  body: { type: String, required: true },
  // neutral | danger
  tone: { type: String, default: 'neutral' },
})
</script>
