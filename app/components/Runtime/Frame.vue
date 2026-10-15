<!-- app/components/Runtime/Frame.vue -->

<!--
  The boundary a running app lives inside: a phone-width card holding either the app itself
  or the message explaining why it cannot start.

  The wrapper is a flex column on purpose. An iframe has no content to be measured by, so a
  percentage height inside a block of indefinite height collapses it to nothing — which looks
  exactly like an app that failed to load. Its children stretch with flex-1 instead, which
  needs no height to resolve against.
-->
<template>
  <div class="flex flex-1 justify-center bg-[#f7f7f4] p-0 sm:p-6">
    <div class="flex w-full flex-col sm:max-w-md">
      <div
        class="flex min-h-[560px] flex-1 flex-col overflow-hidden bg-[#ffffff] sm:rounded-3xl sm:border sm:border-[#e4e4de] sm:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)]"
      >
        <slot />
      </div>
      <p class="hidden items-center justify-center gap-1.5 pt-3 text-[11.5px] text-[#8f9792] sm:flex">
        <i class="fa-solid fa-shield-halved text-[10px] text-[#0b5d3e]" aria-hidden="true"></i>
        Running inside Afronet’s sandbox
      </p>
    </div>
  </div>
</template>
