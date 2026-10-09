<!-- app/pages/verify-id.vue -->

<!--
  African ID verification, outside the shell. Every logged-in user without isDciVerified
  is held here by afronet-auth.global.ts until verification succeeds.
-->
<template>
  <div class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
    <div class="rise w-full max-w-sm text-center">
      <i class="fa-solid fa-shield-halved text-[40px] text-[#0b5d3e]" aria-hidden="true"></i>
      <h1 class="mt-6 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
        Verify your African ID
      </h1>
      <p class="mt-2 text-[14px] leading-relaxed text-[#606863]">
        <template v-if="userStore.user?.firstName">Welcome, {{ userStore.user.firstName }}. </template>
        Verify your identity with DCI to unlock every Afronet service.
      </p>

      <p v-if="formError" class="mt-6 text-[13px] text-[#b22c26]" role="alert">{{ formError }}</p>
      <UiButton block size="lg" class="mt-8" :disabled="verifying" @click="verifyAfricanId">
        {{ verifying ? 'Verifying…' : 'Verify African ID' }}
      </UiButton>

      <p class="mt-6 text-[11px] leading-relaxed text-[#8f9792]">Powered by DCI.</p>
      <button type="button" class="mt-8 text-[12px] text-[#8f9792] hover:text-[#121614]" @click="signOut">
        Sign out
      </button>
    </div>
  </div>
</template>

<script setup>
import { useAfronetUserStore } from '~/stores/afronetUser'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Verify your African ID · Afronet' })

const route = useRoute()
const config = useRuntimeConfig()
const userStore = useAfronetUserStore()

const verifying = ref(false)
const formError = ref('')

const errorMessages = {
  no_african_id: 'You need an issued African ID before you can verify on Afronet. Request one from DCI, then come back.',
  not_verified: 'Your DCI account isn’t verified yet. Please complete DCI verification first, then return here.',
  conflict: 'This African ID is already linked to another Afronet account.',
  cancelled: 'Verification was cancelled. You can try again when you’re ready.',
  failed: 'Something went wrong during verification. Please try again.',
}

onMounted(async () => {
  // Error bounced back from the DCI authorize screen.
  const incomingError = route.query.error
  if (incomingError) {
    formError.value = errorMessages[incomingError] || errorMessages.failed
    return
  }

  // Callback: exchange the token.
  const token = route.query.token
  if (token) {
    verifying.value = true
    try {
      await $fetch('/api/auth/dci-exchange', { method: 'POST', body: { token } })
      await userStore.fetchProfile()
      return navigateTo('/chat', { external: true })
    } catch (err) {
      const s = err?.statusCode || err?.response?.status
      formError.value = errorMessages[s === 409 ? 'conflict' : 'failed']
    } finally {
      verifying.value = false
    }
  }
})

// Kickoff: send the user to DCI's authorize screen.
const verifyAfricanId = async () => {
  formError.value = ''
  verifying.value = true
  const callback = `${window.location.origin}/verify-id`
  window.location.href = `${config.public.dciBaseUrl}/afronet-authorize?redirect=${encodeURIComponent(callback)}`
}

const signOut = async () => {
  await userStore.logout()
  await navigateTo('/welcome')
}
</script>