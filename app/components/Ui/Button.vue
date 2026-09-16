<!-- app/components/Ui/Button.vue -->

<template>
  <button
    class="inline-flex items-center justify-center font-medium transition-[background-color,color,opacity,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:pointer-events-none disabled:opacity-40"
    :class="[variants[variant], sizes[size], block ? 'w-full' : '']"
  >
    <slot name="icon" />
    <slot />
  </button>
</template>

<script setup>
defineProps({
  // primary | secondary | ghost | gold | danger
  variant: { type: String, default: 'primary' },
  // sm | md | lg
  size: { type: String, default: 'md' },
  block: { type: Boolean, default: false },
})

const variants = {
  primary: 'border border-transparent bg-[#0b5d3e] text-[#ffffff] hover:opacity-90',
  secondary: 'border border-[#e4e4de] bg-[#ffffff] text-[#121614] hover:bg-[#f7f7f4]',
  ghost: 'border border-transparent bg-transparent text-[#606863] hover:bg-[#f7f7f4] hover:text-[#121614]',
  gold: 'border border-transparent bg-[#b07f15] text-white hover:opacity-90',
  danger: 'border border-[#b22c26]/30 bg-transparent text-[#b22c26] hover:bg-[#b22c26]/10',
}

const sizes = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[13px]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-6 text-[15px]',
}
</script>
