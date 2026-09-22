<!-- app/pages/welcome/verify/[token].vue -->

<!-- Landing page for the emailed verification link. On success it hands over to the register form. -->
<template>
  <div class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
    <div class="w-full max-w-sm text-center">
      <BrandMark :size="44" class="mx-auto" />

      <template v-if="status === 'verifying'">
        <h1 class="mt-6 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
          Verifying your email
        </h1>
        <p class="mt-3 flex items-center justify-center gap-2 text-[13px] text-[#606863]">
          <UiSpinner /> One moment…
        </p>
      </template>

      <template v-else>
        <h1 class="mt-6 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
          Link not valid
        </h1>
        <p class="mt-3 text-[13px] text-[#606863]" role="alert">{{ error }}</p>
        <UiButton block class="mt-8" @click="navigateTo('/welcome?stage=email')">Send a new link</UiButton>
      </template>
    </div>
  </div>
</template>

<script setup>
import { useAfronetUserStore } from '~/stores/afronetUser'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Verify email · Afronet' })

const route = useRoute()
const userStore = useAfronetUserStore()

// verifying | error
const status = ref('verifying')
const error = ref('')

// Client-only: the session cookie set by verify-email must land in the browser,
// which an SSR-side $fetch would swallow.
onMounted(async () => {
  const res = await userStore.verifyEmail(route.params.token)
  if (!res.success) {
    error.value = res.error || 'This verification link is invalid or has expired.'
    status.value = 'error'
    return
  }
  await navigateTo('/welcome?stage=register', { replace: true })
})
</script>
