<!-- app/pages/chat/[id].vue -->

<!-- One saved conversation, read from this device's storage. -->
<template>
  <AiChatScreen :conversation-id="String(route.params.id || '')" />
</template>

<script setup>
definePageMeta({ layout: 'blank' })
useHead({ title: 'AfroIntel · Afronet' })

const route = useRoute()
</script>
