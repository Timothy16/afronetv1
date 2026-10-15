<!-- app/components/Studio/PreviewPane.vue -->

<!--
  The build, running, at two sizes. It renders the same components the App Store runtime
  renders — not a mock-up of them — so what a developer approves here is what a user gets.

  Phone first, because that is what nearly every Afronet user has.

  Both frames size themselves rather than being fixed. A fixed 300 × 600 phone was narrower
  than any phone actually is, which made every generated app look more cramped here than it
  does in use — worst of all for a build set to larger text, where it was the preview doing
  the squeezing and not the app. It also overflowed the pane on a small screen, where the
  developer is looking at this on the very device it is imitating.

  So: a phone is as wide as there is room for, up to the width of a real one, and as tall as
  the window allows between a readable floor and a sensible ceiling.
-->
<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center gap-2 pb-3">
      <UiSegmentedControl v-model="device" :options="devices" size="sm" />
      <span class="ml-auto hidden items-center gap-1.5 text-[11.5px] text-[#8f9792] sm:flex">
        <i
          class="fa-solid text-[11px]"
          :class="device === 'phone' ? 'fa-mobile-screen' : 'fa-display'"
          aria-hidden="true"
        ></i>
        {{ device === 'phone' ? 'Phone width' : 'Desktop width' }}
      </span>
    </div>

    <div class="afro-scroll flex flex-1 items-start justify-center overflow-auto rounded-2xl bg-[#121614]/5 p-2 sm:p-4">
      <!-- Phone ------------------------------------------------------------->
      <div
        v-if="device === 'phone'"
        class="flex h-[clamp(460px,66vh,640px)] w-full max-w-[360px] flex-col overflow-hidden rounded-[28px] border-[6px] border-[#121614] bg-[#ffffff] sm:rounded-[34px] sm:border-[7px]"
      >
        <StudioPreviewApp :app="app" />
      </div>

      <!-- Desktop ----------------------------------------------------------->
      <div
        v-else
        class="flex h-[clamp(420px,62vh,560px)] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-[#e4e4de] bg-[#ffffff]"
      >
        <div class="flex h-7 shrink-0 items-center gap-1.5 border-b border-[#e4e4de] bg-[#f7f7f4] px-3">
          <span v-for="i in 3" :key="i" class="h-2 w-2 rounded-full bg-[#e4e4de]" />
        </div>
        <div class="mx-auto flex w-full max-w-2xl flex-1 flex-col overflow-hidden">
          <StudioPreviewApp :app="app" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  app: { type: Object, required: true },
})

const devices = [
  { value: 'phone', label: 'Phone' },
  { value: 'desktop', label: 'Desktop' },
]

const device = ref('phone')
</script>
