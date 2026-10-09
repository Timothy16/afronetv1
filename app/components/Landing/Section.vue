<!-- app/components/Landing/Section.vue -->

<!--
  The landing page's section rhythm: an eyebrow, a serif title, a lead
  paragraph, then whatever the section holds. Centring is for the full-width
  closing sections; everything else reads from the left.
-->
<template>
  <!-- scroll-mt clears the fixed landing header, so an in-page link (#about and the rest)
       lands with the section's heading visible rather than tucked behind the bar. -->
  <section class="mx-auto w-full max-w-6xl scroll-mt-20 px-5 sm:px-8" :class="padded ? 'py-14 sm:py-20' : ''">
    <div v-if="eyebrow || title || $slots.lead" :class="[centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl']">
      <p
        v-if="eyebrow"
        class="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#0b5d3e]"
      >
        {{ eyebrow }}
      </p>
      <h2
        v-if="title"
        class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-[1.1] tracking-tight text-[#121614] sm:text-[38px]"
        :class="eyebrow ? 'mt-2.5' : ''"
      >
        {{ title }}
      </h2>
      <div v-if="$slots.lead" class="mt-3 text-[15px] leading-relaxed text-[#606863]">
        <slot name="lead" />
      </div>
    </div>

    <slot />
  </section>
</template>

<script setup>
defineProps({
  eyebrow: { type: String, default: '' },
  title: { type: String, default: '' },
  centered: { type: Boolean, default: false },
  padded: { type: Boolean, default: true },
})
</script>
