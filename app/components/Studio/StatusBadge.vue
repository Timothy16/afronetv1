<!-- app/components/Studio/StatusBadge.vue -->

<!-- Where an app is in the journey from draft to published. One label per state. -->
<template>
  <UiBadge :tone="meta.tone">{{ meta.label }}</UiBadge>
</template>

<script setup>
import { statusMeta } from '~/data/studio'

const props = defineProps({
  status: { type: String, required: true },
})

const meta = computed(() => statusMeta[props.status] ?? { label: props.status, tone: 'muted' })
</script>
