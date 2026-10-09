<!-- app/app.vue -->
<template>
  <NuxtPwaAssets />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <PwaInstallPrompt />
  </ClientOnly>
</template>
