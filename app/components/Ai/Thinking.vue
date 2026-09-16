<!-- app/components/Ai/Thinking.vue -->

<template>
  <div class="flex items-center gap-3" role="status" aria-label="AfroIntel is thinking">
    <BrandMark :size="26" />
    <div class="flex items-center gap-1">
      <span
        v-for="i in 3"
        :key="i"
        class="thinking-dot h-1.5 w-1.5 rounded-full bg-[#8f9792]"
        :style="{ animationDelay: `${(i - 1) * 0.12}s` }"
      />
      <span class="ml-2 text-[12px] text-[#8f9792]">Reasoning on this device…</span>
    </div>
  </div>
</template>

<style scoped>
.thinking-dot {
  animation: thinking-dot 0.9s linear infinite;
}

@keyframes thinking-dot {
  0%,
  100% {
    opacity: 0.25;
  }
  50% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .thinking-dot {
    animation: none;
    opacity: 0.6;
  }
}
</style>
