<!-- app/components/Store/PurchaseDialog.vue -->

<!--
  Buying a paid app. The shape of this screen is the point: payment is taken by the
  gateway, then Afronet's own server confirms it, and only then does the entitlement
  appear. Access is never granted on the strength of the gateway's reply alone.

  Everything here is a simulation with Stripe's documented test cards standing in for the
  real thing. The live version is server work — a Stripe Checkout session, the webhook that
  confirms it, and the entitlement written against the account — and none of it belongs in
  the browser.
-->
<template>
  <UiModal v-if="app" :open="open" :title="heading" @close="dismiss">
    <!-- Review ------------------------------------------------------------>
    <div v-if="phase === 'review'">
      <div class="flex items-center gap-3">
        <StoreAppIcon :icon="app.icon" :tone="app.tone" size="md" />
        <div>
          <p class="text-[15px] font-semibold text-[#121614]">{{ app.name }}</p>
          <p class="text-[12.5px] text-[#606863]">by {{ app.creatorName }} · one-time purchase</p>
        </div>
      </div>

      <dl class="mt-4 space-y-2 rounded-xl border border-[#e4e4de] p-3.5 text-[13.5px]">
        <div class="flex justify-between">
          <dt class="text-[#606863]">Price</dt>
          <dd class="font-semibold text-[#121614]">{{ formatNaira(app.price) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-[#606863]">Fees</dt>
          <dd class="font-semibold text-[#121614]">{{ formatNaira(0) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-[#606863]">Taxes</dt>
          <dd class="text-[12.5px] text-[#606863]">Included where applicable</dd>
        </div>
        <div class="flex justify-between border-t border-[#e4e4de] pt-2 text-[15px]">
          <dt class="font-semibold text-[#121614]">Total (NGN)</dt>
          <dd class="font-semibold text-[#121614]">{{ formatNaira(app.price) }}</dd>
        </div>
      </dl>

      <fieldset class="mt-4">
        <legend class="mb-2 text-[13px] font-semibold text-[#121614]">Payment method</legend>
        <div class="space-y-1.5">
          <label
            v-for="m in methods"
            :key="m.id"
            class="flex items-center gap-3 rounded-xl border px-3 py-2.5"
            :class="
              m.disabled
                ? 'cursor-not-allowed border-[#e4e4de] opacity-50'
                : method === m.id
                  ? 'cursor-pointer border-[#0b5d3e] bg-[#eaf3ee]'
                  : 'cursor-pointer border-[#e4e4de] hover:bg-[#f7f7f4]'
            "
          >
            <input
              type="radio"
              name="afronet-pay-method"
              class="h-4 w-4 accent-[#0b5d3e]"
              :checked="method === m.id"
              :disabled="m.disabled"
              @change="method = m.id"
            />
            <i class="fa-solid w-4 text-center text-[13px] text-[#606863]" :class="m.icon" aria-hidden="true"></i>
            <span class="flex-1 text-[13.5px] font-medium text-[#121614]">{{ m.label }}</span>
            <span class="text-[12px] text-[#606863]">{{ m.detail }}</span>
          </label>
        </div>
      </fieldset>

      <div class="mt-4 rounded-xl bg-[#faf3e3] px-3 py-2.5 text-[12.5px] leading-relaxed text-[#b07f15]">
        <strong>Test mode.</strong> No real money moves. Live purchases run through Stripe and are confirmed on
        Afronet's server before access is given.
      </div>

      <button class="mt-3 text-[12.5px] font-medium text-[#0b5d3e] hover:underline" @click="showRefund = !showRefund">
        Refund policy
      </button>
      <p v-if="showRefund" class="mt-1.5 text-[12.5px] leading-relaxed text-[#606863]">
        Illustrative policy: request a refund within 48 hours if the app doesn’t work as described. Approved refunds
        remove access on all your devices the next time they connect.
      </p>

      <p v-if="!online" class="mt-3 flex items-center gap-2 rounded-xl bg-[#f7f7f4] p-3 text-[13px] text-[#606863]">
        <i class="fa-solid fa-link-slash text-[12px]" aria-hidden="true"></i>
        Purchases need a connection so payment can be verified.
      </p>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton>
        <UiButton :disabled="!online" @click="phase = 'processing'">
          <template #icon><i class="fa-solid fa-lock text-[11px]" aria-hidden="true"></i></template>
          Pay {{ formatNaira(app.price) }} (test)
        </UiButton>
      </div>
    </div>

    <!-- Taking payment, then confirming it -------------------------------->
    <div v-else-if="phase === 'processing' || phase === 'verifying'" class="py-1">
      <div class="flex items-center gap-3">
        <UiSpinner />
        <p class="text-[15px] font-semibold text-[#121614]">
          {{ phase === 'processing' ? 'Waiting for the payment provider…' : 'Verifying your purchase…' }}
        </p>
      </div>
      <p class="mt-1 pl-7 text-[13px] text-[#606863]">Access is granted only after the server confirms payment.</p>

      <ol class="mt-5 space-y-2.5 pl-1">
        <li
          v-for="(s, i) in steps"
          :key="s"
          class="flex items-center gap-2.5 text-[13.5px]"
          :class="phase === 'verifying' && verifyStep > i ? 'text-[#121614]' : 'text-[#8f9792]'"
        >
          <i
            v-if="phase === 'verifying' && verifyStep > i"
            class="fa-solid fa-circle-check text-[13px] text-[#0b5d3e]"
            aria-hidden="true"
          ></i>
          <span v-else class="h-3.5 w-3.5 rounded-full border-2 border-[#e4e4de]" />
          {{ s }}
        </li>
      </ol>

      <div v-if="phase === 'processing'" class="mt-6 flex justify-end">
        <UiButton variant="ghost" @click="phase = 'cancelled'">Cancel payment</UiButton>
      </div>
    </div>

    <!-- Verified ---------------------------------------------------------->
    <div v-else-if="phase === 'success' && receipt">
      <div class="text-center">
        <span class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eaf3ee] text-[#0b5d3e]">
          <i class="fa-solid fa-shield-halved text-[24px]" aria-hidden="true"></i>
        </span>
        <p class="mt-3 text-[17px] font-semibold text-[#121614]">Purchase verified</p>
        <p class="text-[13px] text-[#606863]">{{ app.name }} is now linked to your Afronet account.</p>
      </div>

      <dl class="mt-4 space-y-1.5 rounded-xl border border-[#e4e4de] p-3.5 text-[13px]">
        <div class="flex justify-between"><dt class="text-[#606863]">Reference</dt><dd class="font-semibold text-[#121614]">{{ receipt.ref }}</dd></div>
        <div class="flex justify-between"><dt class="text-[#606863]">Amount</dt><dd class="font-semibold text-[#121614]">{{ formatNaira(receipt.amount) }}</dd></div>
        <div class="flex justify-between"><dt class="text-[#606863]">Method</dt><dd class="font-semibold text-[#121614]">{{ receipt.method }}</dd></div>
        <div class="flex justify-between"><dt class="text-[#606863]">Date</dt><dd class="font-semibold text-[#121614]">{{ formatDate(receipt.date) }}</dd></div>
      </dl>

      <p class="mt-3 text-[12.5px] leading-relaxed text-[#606863]">
        Sign in on another device and use <strong class="text-[#121614]">Restore purchases</strong> to download it
        again.
      </p>
      <p class="mt-2 text-[11.5px] text-[#8f9792]">Test-mode receipt — no real money moved.</p>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="secondary" @click="emit('close')">Later</UiButton>
        <UiButton @click="downloadNow">Download now</UiButton>
      </div>
    </div>

    <!-- Declined or cancelled --------------------------------------------->
    <div v-else>
      <div class="py-1 text-center">
        <span
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl"
          :class="phase === 'failed' ? 'bg-[#b22c26]/10 text-[#b22c26]' : 'bg-[#f7f7f4] text-[#606863]'"
        >
          <i class="fa-solid fa-circle-xmark text-[20px]" aria-hidden="true"></i>
        </span>
        <p class="mt-3 text-[16px] font-semibold text-[#121614]">
          {{ phase === 'failed' ? 'Payment declined' : 'Payment cancelled' }}
        </p>
        <p class="mx-auto mt-1 max-w-xs text-[13px] text-[#606863]">
          {{
            phase === 'failed'
              ? 'The issuer declined test card 0002. You were not charged and no access was granted.'
              : 'You cancelled before payment was confirmed. You were not charged.'
          }}
        </p>
      </div>

      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="secondary" @click="emit('close')">Close</UiButton>
        <UiButton @click="phase = 'review'">{{ phase === 'failed' ? 'Try another method' : 'Back to checkout' }}</UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script setup>
import { formatDate, formatNaira } from '~/data/store'

const props = defineProps({
  appId: { type: String, required: true },
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'purchased'])

const { online, getApp, recordPurchase } = useAppLibrary()

const app = computed(() => getApp(props.appId))

// Stripe's own test cards, so the declined path can be walked without inventing one.
const methods = [
  { id: 'card-ok', label: 'Test card •••• 4242', detail: 'Stripe test · approves', icon: 'fa-credit-card', disabled: false },
  { id: 'card-3ds', label: 'Test card •••• 3155', detail: 'Stripe test · asks to confirm', icon: 'fa-credit-card', disabled: false },
  { id: 'card-decline', label: 'Test card •••• 0002', detail: 'Stripe test · declines', icon: 'fa-credit-card', disabled: false },
  { id: 'wallet', label: 'Afronet Wallet', detail: 'Coming later', icon: 'fa-wallet', disabled: true },
]

const steps = [
  'Stripe confirmed the charge (test mode)',
  'Afronet’s server verified the transaction',
  'Entitlement added to your account',
]

const phase = ref('review')
const method = ref('card-ok')
const verifyStep = ref(0)
const receipt = ref(null)
const showRefund = ref(false)

const heading = computed(
  () =>
    ({
      review: 'Confirm purchase',
      processing: 'Taking payment',
      verifying: 'Confirming purchase',
      success: 'Purchase verified',
      failed: 'Payment declined',
      cancelled: 'Payment cancelled',
    })[phase.value],
)

// Hands straight over to the install dialog, so a purchase runs into its download.
const downloadNow = () => {
  emit('close')
  emit('purchased')
}

// While money is notionally moving the dialog cannot be dismissed by accident.
const dismiss = () => {
  if (phase.value === 'processing' || phase.value === 'verifying') return
  emit('close')
}

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    phase.value = 'review'
    verifyStep.value = 0
    receipt.value = null
  },
)

// The walk through the phases. Timers only ever start in the browser, and every one is
// cleared when the dialog goes away, so a closed dialog cannot finish a purchase.
let pending = null

const clearPending = () => {
  if (pending) clearTimeout(pending)
  pending = null
}

watch([phase, verifyStep], () => {
  if (!import.meta.client) return
  clearPending()

  if (phase.value === 'processing') {
    pending = setTimeout(() => {
      phase.value = method.value === 'card-decline' ? 'failed' : 'verifying'
    }, 1600)
    return
  }

  if (phase.value === 'verifying') {
    if (verifyStep.value < steps.length) {
      pending = setTimeout(() => {
        verifyStep.value += 1
      }, 650)
      return
    }
    const chosen = methods.find((m) => m.id === method.value)
    receipt.value = recordPurchase(props.appId, chosen.label)
    phase.value = 'success'
  }
})

onBeforeUnmount(clearPending)
</script>
