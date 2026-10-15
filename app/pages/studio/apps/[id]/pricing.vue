<!-- app/pages/studio/apps/[id]/pricing.vue -->

<!--
  Free, or a price. That is the whole decision in this release.

  Deliberately not here: the commission and fee breakdown. Afronet's rate has not been set,
  and a screen showing a developer what they would keep — based on a number we invented —
  would be worse than showing nothing. It arrives when the rate does.

  Also not here: subscriptions and in-app purchases. Both need payment flows that do not
  exist, so neither is offered.
-->
<template>
  <div v-if="app">
    <StudioAppSubnav :app="app">
      <template #actions>
        <UiButton :disabled="!valid" @click="save">Save pricing</UiButton>
      </template>
    </StudioAppSubnav>

    <div class="max-w-2xl space-y-6">
      <section>
        <h2 class="text-[16px] font-semibold text-[#121614]">How will people get your app?</h2>
        <div class="mt-3 grid gap-2 sm:grid-cols-2">
          <button
            v-for="m in models"
            :key="m.id"
            :aria-pressed="app.pricingModel === m.id ? 'true' : 'false'"
            class="rounded-2xl border p-4 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            :class="
              app.pricingModel === m.id
                ? 'border-[#121614] bg-[#ffffff]'
                : 'border-[#e4e4de] bg-[#ffffff] hover:border-[#0b5d3e]/40'
            "
            @click="choose(m.id)"
          >
            <span class="block text-[14.5px] font-semibold text-[#121614]">{{ m.title }}</span>
            <span class="mt-1 block text-[13px] leading-relaxed text-[#606863]">{{ m.body }}</span>
          </button>
        </div>
      </section>

      <section v-if="app.pricingModel === 'paid'" class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6">
        <h2 class="text-[16px] font-semibold text-[#121614]">Listing price</h2>
        <p class="mt-1 text-[13px] text-[#606863]">A one-time payment. Buyers keep it on any device they sign in to.</p>

        <div class="mt-4 flex flex-wrap items-center gap-3">
          <div class="flex h-12 items-center rounded-xl border border-[#e4e4de] px-3">
            <span class="text-[16px] font-semibold text-[#606863]">₦</span>
            <input
              :value="app.price"
              type="number"
              min="100"
              step="50"
              aria-label="Price in naira"
              class="w-28 bg-transparent px-2 text-[20px] font-semibold text-[#121614] focus:outline-none"
              @input="update({ price: Math.max(0, Number($event.target.value)) })"
            />
          </div>
          <UiSelect :model-value="'NGN'" :options="currencies" size="lg" aria-label="Currency" class="w-[220px]" />
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          <button
            v-for="v in suggested"
            :key="v"
            class="rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            :class="app.price === v ? 'border-[#121614] bg-[#121614] text-[#ffffff]' : 'border-[#e4e4de] text-[#606863]'"
            @click="update({ price: v })"
          >
            {{ formatNaira(v) }}
          </button>
        </div>

        <p v-if="app.price < 100" class="mt-3 text-[12.5px] text-[#b07f15]">
          The lowest price we can process is ₦100.
        </p>

        <p class="mt-4 text-[12.5px] leading-relaxed text-[#606863]">
          <strong class="text-[#121614]">Refunds:</strong> buyers can ask for one within 48 hours. A refund removes
          access the next time their device connects. This is illustrative until the policy is set.
        </p>
      </section>

      <section v-else class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6">
        <h2 class="text-[16px] font-semibold text-[#121614]">Free</h2>
        <p class="mt-1 text-[13px] leading-relaxed text-[#606863]">
          Nothing to pay and nothing to set up. You can start charging later — anyone who already has it keeps it for
          free.
        </p>
      </section>

      <section class="flex items-start gap-3 rounded-3xl bg-[#121614] p-5 text-[13px] leading-relaxed text-[#ffffff]/70">
        <i class="fa-solid fa-lock mt-0.5 shrink-0 text-[13px] text-[#ffffff]" aria-hidden="true"></i>
        <p>
          <strong class="text-[#ffffff]">How a purchase is honoured.</strong> Payment is taken by Stripe and then
          confirmed by Afronet's own server before access is given. The app checks a signed entitlement, so editing
          anything in the browser cannot unlock a paid app. That confirmation is server work and is not built yet.
        </p>
      </section>

      <p class="text-[12px] text-[#8f9792]">
        Afronet's commission has not been set, so this screen does not yet show what you would receive from a sale.
      </p>
    </div>
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="Project not found" body="It may have been archived or deleted.">
      <template #action><UiButton to="/studio/apps">My Apps</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { formatNaira } from '~/data/store'

definePageMeta({ layout: 'studio' })

const route = useRoute()

const { findDevApp, updateDevApp, notify } = useStudio()

const app = computed(() => findDevApp(String(route.params.id || '')))

useHead({ title: computed(() => `Pricing · ${app.value?.name ?? 'App'} · Afronet Studio`) })

const models = [
  { id: 'free', title: 'Free', body: 'The fastest way to be used. A good choice for a first app.' },
  { id: 'paid', title: 'Paid download', body: 'One price, paid once. Restorable on any device.' },
]

const currencies = [
  { id: 'NGN', name: 'NGN — Nigerian naira' },
  { id: 'GHS', name: 'GHS — coming later' },
  { id: 'KES', name: 'KES — coming later' },
]

const suggested = [300, 500, 1000, 2000]

const update = (patch) => updateDevApp(app.value.id, patch)

const valid = computed(() => app.value.pricingModel === 'free' || app.value.price >= 100)

const choose = (model) => {
  update({ pricingModel: model, price: model === 'free' ? 0 : app.value.price || 500 })
}

const save = () => {
  update({ pricingDone: true })
  notify(app.value.pricingModel === 'free' ? 'Saved — this app is free.' : `Saved — ${formatNaira(app.value.price)}.`, 'success')
}
</script>
