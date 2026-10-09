<!-- app/components/Landing/PartnerForm.vue -->

<!--
  The institution enquiry form. Nothing is sent anywhere — it validates,
  pauses, then confirms, so the shape of the exchange is reviewable before a
  real endpoint exists behind it.
-->
<template>
  <div class="rounded-[24px] bg-[#ffffff] p-6 ring-1 ring-[#e4e4de] sm:p-8">
    <div v-if="state === 'success'" role="status">
      <i class="fa-solid fa-circle-check text-[32px] text-[#0b5d3e]" aria-hidden="true"></i>
      <h3 class="mt-4 font-['Instrument_Serif',Georgia,serif] text-[26px] leading-tight tracking-tight text-[#121614]">
        Thank you, {{ firstName }}.
      </h3>
      <p class="mt-2.5 text-[15px] leading-relaxed text-[#606863]">
        We’ve received your enquiry for {{ values.institution }}. Our partnerships team will contact you at
        {{ values.email }} about pilots and next steps.
      </p>
      <UiButton block size="lg" class="mt-7" @click="reset">Send another enquiry</UiButton>
    </div>

    <form v-else novalidate @submit.prevent="submit">
      <p class="text-[15px] leading-relaxed text-[#606863]">
        Tell us about your institution and we’ll be in touch about pilots and partnerships.
      </p>

      <div class="mt-6 grid gap-4 sm:grid-cols-2">
        <LandingFormField label="Institution name" :error="errors.institution">
          <UiInput
            v-model="values.institution"
            size="lg"
            autocomplete="organization"
            :aria-invalid="Boolean(errors.institution)"
            :class="errors.institution ? 'border-[#b22c26]' : ''"
          />
        </LandingFormField>
        <LandingFormField label="Your name" :error="errors.contactName">
          <UiInput
            v-model="values.contactName"
            size="lg"
            autocomplete="name"
            :aria-invalid="Boolean(errors.contactName)"
            :class="errors.contactName ? 'border-[#b22c26]' : ''"
          />
        </LandingFormField>
        <LandingFormField label="Work email" :error="errors.email">
          <UiInput
            v-model="values.email"
            size="lg"
            type="email"
            autocomplete="email"
            :aria-invalid="Boolean(errors.email)"
            :class="errors.email ? 'border-[#b22c26]' : ''"
          />
        </LandingFormField>
        <LandingFormField label="Country" :error="errors.country">
          <UiInput
            v-model="values.country"
            size="lg"
            autocomplete="country-name"
            :aria-invalid="Boolean(errors.country)"
            :class="errors.country ? 'border-[#b22c26]' : ''"
          />
        </LandingFormField>

        <div class="sm:col-span-2">
          <UiField label="I’m interested in">
            <select
              v-model="values.interest"
              class="h-12 w-full rounded-xl border border-[#e4e4de] bg-[#ffffff] px-3.5 text-sm text-[#121614] transition-colors duration-150 focus:border-[#0b5d3e] focus:outline-none"
            >
              <option v-for="option in partnerInterests" :key="option" :value="option">{{ option }}</option>
            </select>
          </UiField>
        </div>

        <div class="sm:col-span-2">
          <UiField label="Anything else?" hint="Optional">
            <UiTextarea v-model="values.message" :rows="3" />
          </UiField>
        </div>
      </div>

      <UiButton type="submit" block size="lg" class="mt-6" :disabled="state === 'submitting'">
        <template v-if="state === 'submitting'">
          <i class="fa-solid fa-spinner animate-spin text-[13px]" aria-hidden="true"></i>
          Sending enquiry…
        </template>
        <template v-else>Send enquiry</template>
      </UiButton>
    </form>
  </div>
</template>

<script setup>
import { newPartnerEnquiry, partnerInterests, validatePartnerEnquiry } from '~/data/landing'

const values = ref(newPartnerEnquiry())
const errors = ref({})
const state = ref('idle')
let timer

const firstName = computed(() => values.value.contactName.trim().split(' ')[0])

// Clear a field's error as soon as it is edited, rather than holding it until
// the next submit.
watch(
  values,
  () => {
    if (Object.keys(errors.value).length) errors.value = validatePartnerEnquiry(values.value)
  },
  { deep: true },
)

const submit = () => {
  const found = validatePartnerEnquiry(values.value)
  errors.value = found
  if (Object.keys(found).length) return
  state.value = 'submitting'
  timer = setTimeout(() => {
    state.value = 'success'
  }, 900)
}

const reset = () => {
  values.value = newPartnerEnquiry()
  errors.value = {}
  state.value = 'idle'
}

onBeforeUnmount(() => clearTimeout(timer))
</script>
