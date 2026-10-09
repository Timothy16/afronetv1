<!-- app/components/Brand/Logo.vue -->

<!--
  The wordmark. It links to the landing page by default, wherever it appears — pass `to` for a
  different destination, or `to=""` for the few places where it is decoration rather than a way out.
-->
<template>
  <component
    :is="to ? NuxtLink : 'span'"
    :to="to || undefined"
    :aria-label="to ? ariaLabel : undefined"
    class="inline-flex items-center gap-2.5 text-[#121614]"
  >
    <BrandMark :size="size" />
    <!-- Inherits the surrounding text colour: #121614 everywhere it sits on a light
         background, white where a parent sets it (the landing header over the hero). -->
    <span v-if="showWord" class="text-[17px] font-semibold tracking-[-0.02em] text-current">Afronet</span>
  </component>
</template>

<script setup>
import { NuxtLink } from '#components'

defineProps({
  size: { type: Number, default: 28 },
  showWord: { type: Boolean, default: true },
  // Where the logo leads. Empty renders a plain span instead of a link.
  to: { type: String, default: '/' },
  ariaLabel: { type: String, default: 'Afronet home' },
})
</script>
