<!-- app/components/Workspace/AppWindow.vue -->

<!--
  Renders an app inside a workspace window. Six apps have an embedded view;
  anything else shows a "not in this build" panel, as in the design.
-->
<template>
  <WorkspaceWindowFrame :app-id="appId" @ask="emit('ask', $event)">
    <AppsNetwork v-if="appId === 'mesh'" embedded />
    <AppsMessages v-else-if="appId === 'messages'" embedded />
    <AppsFiles v-else-if="appId === 'files'" embedded />
    <AppsMail v-else-if="appId === 'mail'" embedded />
    <AppsWallet v-else-if="appId === 'wallet'" embedded />
    <AppsAfrotainment v-else-if="appId === 'afrotainment'" embedded />
    <div v-else class="p-6">
      <UiStatePanel
        title="Not in this build"
        body="This service opens in the workspace once its V1 release lands. Everything else keeps working."
      />
    </div>
  </WorkspaceWindowFrame>
</template>

<script setup>
defineProps({
  appId: { type: String, required: true },
})

const emit = defineEmits(['ask'])
</script>
