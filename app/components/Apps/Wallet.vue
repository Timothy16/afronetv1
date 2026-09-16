<!-- app/components/Apps/Wallet.vue -->

<!-- Afronet Wallet. Rendered by /wallet, and inside a workspace window with `embedded`. -->
<template>
  <div :class="embedded ? 'p-5' : 'mx-auto w-full max-w-5xl px-5 py-8'">
    <UiPageHeader
      v-if="!embedded"
      eyebrow="Economic layer"
      title="Afronet Wallet"
      description="Money moves against your African ID. Payments sign on your device and settle when a path exists."
    >
      <template #actions>
        <UiBadge tone="brand">
          <i class="fa-solid fa-shield-halved text-[10px]" aria-hidden="true"></i>
          {{ wallet.tier }}
        </UiBadge>
      </template>
    </UiPageHeader>

    <UiCard class="mt-6 overflow-hidden">
      <div class="bg-[#0b5d3e] p-6 text-[#ffffff]">
        <p class="text-[12px] opacity-80">Available balance</p>
        <p class="mt-1 font-['Instrument_Serif',Georgia,serif] text-[40px] leading-none">{{ money(wallet.available) }}</p>
        <p class="mt-3 text-[12px] opacity-80">
          {{ money(wallet.held) }} held in a queued transfer · {{ me.username }} · {{ wallet.address }}
        </p>
      </div>
      <div class="grid grid-cols-4 divide-x divide-[#e4e4de]">
        <button
          v-for="a in actions"
          :key="a.id"
          class="flex flex-col items-center gap-1.5 py-4 text-[12px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
          @click="flow = a.id === 'pay' ? 'scan' : a.id"
        >
          <i class="fa-solid text-[16px] text-[#0b5d3e]" :class="a.icon" aria-hidden="true"></i>
          {{ a.label }}
        </button>
      </div>
    </UiCard>

    <p v-if="queued" class="mt-4 rounded-xl border border-[#e4e4de] bg-[#faf3e3] px-4 py-3 text-[12px] text-[#b07f15]">
      No gateway in reach. Payments you make now are signed on this device and released automatically — nothing is
      lost.
    </p>

    <div class="mt-8 grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <UiSectionHeading title="Transactions" hint="Receipts are stored on device" />
        <div class="mt-4 overflow-hidden rounded-2xl border border-[#e4e4de]">
          <div
            v-for="(t, i) in transactions"
            :key="t.id"
            class="flex items-center gap-4 px-4 py-3.5"
            :class="i > 0 ? 'border-t border-[#e4e4de]' : ''"
          >
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full"
              :class="t.direction === 'in' ? 'bg-[#eaf3ee] text-[#0b5d3e]' : 'bg-[#f7f7f4] text-[#606863]'"
            >
              <i
                class="fa-solid rotate-45 text-[14px]"
                :class="t.direction === 'in' ? 'fa-arrow-down' : 'fa-arrow-up'"
                aria-hidden="true"
              ></i>
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-[13px] font-medium text-[#121614]">{{ t.label }}</p>
              <p class="mt-0.5 flex items-center gap-1.5 text-[11px] text-[#8f9792]">
                <i v-if="t.status === 'queued'" class="fa-solid fa-clock text-[10px] text-[#b07f15]" aria-hidden="true"></i>
                {{ t.handle }} · {{ t.time }}
              </p>
            </div>
            <p class="text-[13px] font-medium" :class="t.direction === 'in' ? 'text-[#147a4c]' : 'text-[#121614]'">
              {{ t.direction === 'in' ? '+' : '−' }}{{ money(t.amount) }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-5">
        <UiCard class="p-5">
          <UiSectionHeading title="Security" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Transaction PIN">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
            </UiRow>
            <UiRow label="Biometric approval">
              <template #value><UiBadge tone="brand">Fingerprint</UiBadge></template>
            </UiRow>
            <UiRow label="Monthly limit" :hint="wallet.monthlyLimit" :value="`${Math.round(wallet.usedLimit * 100)}% used`" />
            <UiRow label="Merchant mode">
              <template #value><UiComingSoon /></template>
            </UiRow>
          </div>
          <UiProgress :value="wallet.usedLimit * 100" class="mt-4" tone="gold" />
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Coming to the wallet" />
          <ul class="mt-3 space-y-2 text-[13px] text-[#606863]">
            <li v-for="i in upcoming" :key="i" class="flex items-center justify-between gap-3">
              {{ i }}
              <UiComingSoon />
            </li>
          </ul>
        </UiCard>
      </div>
    </div>

    <!-- Send -->
    <UiModal :open="flow === 'send'" title="Send money" @close="close">
      <div v-if="step === 'amount'" class="space-y-4">
        <UiInput v-model="recipient" placeholder="@username, phone or wallet address" />
        <div class="rounded-2xl border border-[#e4e4de] p-5 text-center">
          <p class="text-[12px] text-[#8f9792]">Amount</p>
          <div class="mt-1 flex items-center justify-center gap-1">
            <span class="font-['Instrument_Serif',Georgia,serif] text-[32px] text-[#606863]">₦</span>
            <input
              v-model="amount"
              aria-label="Amount"
              class="w-40 bg-transparent text-center font-['Instrument_Serif',Georgia,serif] text-[36px] text-[#121614] focus:outline-none"
            />
          </div>
          <p class="mt-2 text-[11px] text-[#8f9792]">Balance {{ money(wallet.available) }}</p>
        </div>
        <UiButton block @click="step = 'confirm'">Continue</UiButton>
      </div>

      <div v-else-if="step === 'confirm'" class="space-y-4">
        <div class="rounded-2xl border border-[#e4e4de] p-4">
          <UiRow label="To" :value="recipient" />
          <UiRow label="Amount" :value="`₦${amount}`" />
          <UiRow label="Fee" value="₦0 over Afronet" />
          <UiRow label="Route" :value="queued ? 'Queued until a gateway' : 'Direct settlement'" />
        </div>
        <div class="flex flex-col items-center rounded-2xl bg-[#f7f7f4] p-6">
          <i class="fa-solid fa-fingerprint text-[32px] text-[#0b5d3e]" aria-hidden="true"></i>
          <p class="mt-3 text-[13px] text-[#121614]">Confirm with your fingerprint</p>
          <p class="mt-1 text-[11px] text-[#8f9792]">Or enter your 6-digit Afronet PIN</p>
        </div>
        <UiButton block @click="step = 'done'">Approve</UiButton>
      </div>

      <UiStatePanel
        v-else
        kind="success"
        :title="queued ? 'Signed and queued' : 'Payment sent'"
        :body="
          queued
            ? `₦${amount} to ${recipient} is signed on this device and will release at the next Afronet gateway.`
            : `₦${amount} reached ${recipient}. The receipt is saved on your device.`
        "
      >
        <template #action>
          <UiButton size="sm" @click="close">Done</UiButton>
        </template>
      </UiStatePanel>
    </UiModal>

    <!-- Receive -->
    <UiModal :open="flow === 'receive'" title="Receive money" @close="close">
      <UiSegmentedControl
        v-model="receiveVia"
        :options="[
          { value: 'qr', label: 'QR code' },
          { value: 'username', label: 'African ID' },
          { value: 'address', label: 'Address' },
        ]"
      />
      <div class="mt-5 flex flex-col items-center rounded-2xl border border-[#e4e4de] p-8">
        <template v-if="receiveVia === 'qr'">
          <div class="grid h-40 w-40 grid-cols-8 gap-0.5 rounded-xl bg-[#ffffff] p-2">
            <span v-for="i in 64" :key="i" class="rounded-[1px]" :class="qrCell(i - 1) ? 'bg-[#121614]' : 'bg-transparent'" />
          </div>
          <p class="mt-4 text-[13px] text-[#121614]">{{ me.username }}</p>
          <p class="mt-1 text-[11px] text-[#8f9792]">Works offline — the payer's device signs and forwards it later.</p>
        </template>
        <template v-else-if="receiveVia === 'username'">
          <i class="fa-solid fa-qrcode text-[28px] text-[#8f9792]" aria-hidden="true"></i>
          <p class="mt-3 font-['Instrument_Serif',Georgia,serif] text-[26px] text-[#121614]">{{ me.username }}</p>
          <p class="mt-1 text-[12px] text-[#606863]">{{ me.phone }}</p>
        </template>
        <template v-else>
          <p class="text-[12px] text-[#8f9792]">Wallet address</p>
          <p class="mt-2 break-all text-center text-[15px] text-[#121614]">{{ wallet.address }}</p>
        </template>
      </div>
      <UiButton block variant="secondary" class="mt-4" @click="close">Share details</UiButton>
    </UiModal>

    <!-- Scan -->
    <UiModal :open="flow === 'scan'" title="Scan to pay" @close="close">
      <div class="flex aspect-square items-center justify-center rounded-2xl border border-[#e4e4de] bg-[#f7f7f4]">
        <div class="relative h-44 w-44 rounded-xl border-2 border-[#0b5d3e]">
          <span class="absolute inset-x-0 top-1/2 h-0.5 bg-[#0b5d3e]/60" />
        </div>
      </div>
      <p class="mt-4 text-center text-[12px] text-[#606863]">
        Point at a merchant code. Merchant payments arrive with the wallet's next release.
      </p>
      <div class="mt-3 flex justify-center">
        <UiComingSoon />
      </div>
    </UiModal>
  </div>
</template>

<script setup>
import { transactions, wallet } from '~/data/commerce'
import { me } from '~/data/people'

defineProps({
  embedded: { type: Boolean, default: false },
})

const { mode } = useAfronet()

// send | receive | scan | null
const flow = ref(null)
// amount | confirm | done
const step = ref('amount')
const amount = ref('20,000')
const recipient = ref('@john')
// qr | username | address
const receiveVia = ref('qr')

const queued = computed(() => mode.value === 'offline' || mode.value === 'afronet')

// Font Awesome has no diagonal arrows, so the straight ones are turned 45°.
const actions = [
  { id: 'send', label: 'Send', icon: 'fa-arrow-up rotate-45' },
  { id: 'receive', label: 'Receive', icon: 'fa-arrow-down rotate-45' },
  { id: 'scan', label: 'Scan', icon: 'fa-expand' },
  { id: 'pay', label: 'Pay', icon: 'fa-store' },
]

const upcoming = ['Merchant payments', 'Creator payouts', 'Subscriptions', 'Cross-border African transfer']

// The decorative QR pattern, exactly as the design draws it.
const qrOn = [0, 1, 2, 7, 8, 14, 16, 21, 23, 27, 30, 33, 38, 41, 45, 49, 52, 56, 60, 63]
const qrCell = (i) => qrOn.includes(i % 64) || i % 5 === 0

const money = (n) => `₦${n.toLocaleString('en-NG')}`

const close = () => {
  flow.value = null
  step.value = 'amount'
}
</script>
