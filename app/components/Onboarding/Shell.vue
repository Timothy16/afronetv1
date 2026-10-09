<!-- app/components/Onboarding/Shell.vue -->

<!--
  Frame shared by the onboarding screens: a scrolling body with the actions
  pinned beneath it, so a long screen never buries its own Continue button.

  Centred and width-capped from `sm` up, because these screens were drawn for
  a phone and stretching a single column across a desktop reads as broken.
-->
<template>
  <div class="flex min-h-[100dvh] w-full flex-col bg-[#ffffff]">
    <div v-if="$slots.header" class="shrink-0 px-5 pt-5 sm:px-8">
      <div class="mx-auto w-full max-w-lg">
        <slot name="header" />
      </div>
    </div>

    <div class="afro-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8">
      <div class="mx-auto w-full max-w-lg">
        <slot />
      </div>
    </div>

    <div v-if="$slots.footer" class="shrink-0 border-t border-[#e4e4de] bg-[#ffffff] px-5 py-4 sm:px-8">
      <div class="mx-auto flex w-full max-w-lg flex-col gap-2.5">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>
