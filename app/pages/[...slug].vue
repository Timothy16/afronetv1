<!-- app/pages/[...slug].vue -->

<!--
  Unknown paths.

  This used to redirect to /, which was the app home — so an unknown path
  quietly landed you where you were probably going. Now that / is the public
  landing page, that redirect would eject someone mid-session out to
  marketing, which reads as being signed out. And a silent redirect means a
  bad URL never returns a 404 at all, which is worth avoiding on a site with
  a public front door.

  So it answers honestly instead, and offers both exits: back to the landing
  page for a visitor, into the app for someone already using it.
-->
<template>
  <div class="flex min-h-[100dvh] w-full items-center justify-center px-5 py-20">
    <div class="w-full max-w-md text-center">
      <BrandMark :size="40" class="mx-auto" />

      <p class="mt-7 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8f9792]">Error 404</p>
      <h1 class="mt-2.5 font-['Instrument_Serif',Georgia,serif] text-[34px] leading-tight text-[#121614]">
        This page isn’t on the network.
      </h1>
      <p class="mt-3 text-[15px] leading-relaxed text-[#606863]">
        The address may have changed, or the page may not have been built yet.
      </p>

      <div class="mt-8 space-y-2.5">
        <UiButton to="/home" block size="lg">Go to Afronet</UiButton>
        <UiButton to="/" block size="lg" variant="secondary">Back to afronet.africa</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ layout: 'blank' })

useHead({ title: 'Page not found · Afronet' })

// Nothing here should be indexed, and the status has to be a real 404 rather
// than a 200 with apologetic copy on it.
useHead({ meta: [{ name: 'robots', content: 'noindex, follow' }] })

// Undefined in the browser, so only the server render sets the status.
const event = useRequestEvent()
if (event) setResponseStatus(event, 404)
</script>
