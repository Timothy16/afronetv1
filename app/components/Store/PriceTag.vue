<!-- app/components/Store/PriceTag.vue -->

<!--
  Free, or a one-time price in naira. There is no third option: in-app purchases would need a
  payment flow inside a running app, which does not exist, so no listing offers one.
-->
<template>
  <span v-if="price === 0" class="whitespace-nowrap text-[12px] font-medium" :class="onDark ? 'text-[#ffffff]' : 'text-[#606863]'">
    Free
  </span>
  <span v-else class="whitespace-nowrap text-[12px] font-semibold" :class="onDark ? 'text-[#ffffff]' : 'text-[#121614]'">
    {{ formatNaira(price) }}
  </span>
</template>

<script setup>
import { formatNaira } from '~/data/store'

defineProps({
  price: { type: Number, required: true },
  // Set on the dark featured hero, where the usual ink would disappear.
  onDark: { type: Boolean, default: false },
})
</script>
