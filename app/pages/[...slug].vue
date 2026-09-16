<!-- app/pages/[...slug].vue -->

<template>
  <div />
</template>

<script setup>
// The design renders the home page at any unknown path; redirecting keeps the
// URL honest while landing the user in the same place.
await navigateTo('/', { replace: true })
</script>
