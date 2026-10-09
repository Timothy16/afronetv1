<!-- app/pages/chat/index.vue -->

<!--
  A new AfroIntel chat. The conversation gets its own address (/chat/:id) once the first
  question is sent. See AiChatScreen for the UI, and nuxt.config for why this route is
  client-rendered and cross-origin isolated.
-->
<template>
  <AiChatScreen />
</template>

<script setup>
definePageMeta({ layout: 'blank' })
useHead({ title: 'AfroIntel · Afronet' })
</script>
