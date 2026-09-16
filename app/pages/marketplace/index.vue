<!-- app/pages/marketplace/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="Economic layer"
      title="Marketplace"
      description="Businesses that trade with an African ID and settle in the Afronet Wallet — including where the internet does not reach."
    >
      <template #actions>
        <UiComingSoon />
      </template>
    </UiPageHeader>

    <div class="relative mt-6">
      <i
        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
        aria-hidden="true"
      ></i>
      <UiInput size="lg" placeholder="Search products, services or businesses" class="pl-10" />
    </div>

    <UiCard class="mt-4 flex flex-wrap items-center gap-3 p-4">
      <i class="fa-solid fa-wand-magic-sparkles shrink-0 text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
      <p class="flex-1 text-[13px] text-[#606863]">
        Ask AfroIntel: “Find drought-tolerant maize seed under ₦15,000 within one day of Jalingo.”
      </p>
      <UiButton size="sm" variant="secondary">Ask</UiButton>
    </UiCard>

    <section class="mt-8">
      <UiSectionHeading title="Businesses near you" hint="Verified through their African ID" />
      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UiCard v-for="m in merchants" :key="m.id" class="p-5" interactive>
          <div class="flex items-start justify-between gap-2">
            <h3 class="text-[14px] font-semibold leading-snug text-[#121614]">{{ m.name }}</h3>
            <i v-if="m.verified" class="fa-solid fa-shield-halved shrink-0 text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
          </div>
          <p class="mt-1 text-[12px] text-[#606863]">{{ m.category }}</p>
          <p class="mt-2 flex items-center gap-1 text-[12px] text-[#121614]">
            <i class="fa-solid fa-star text-[12px] text-[#b07f15]" aria-hidden="true"></i>
            {{ m.rating }}
            <span class="text-[#8f9792]">({{ m.reviews }})</span>
          </p>
          <p class="mt-1 text-[11px] text-[#8f9792]">{{ m.location }}</p>
          <UiButton size="sm" variant="secondary" class="mt-3">
            <template #icon><i class="fa-solid fa-message text-[12px]" aria-hidden="true"></i></template>
            Message
          </UiButton>
        </UiCard>
      </div>
    </section>

    <section class="mt-8">
      <UiSectionHeading title="Popular listings" />
      <div class="mt-4 overflow-hidden rounded-2xl border border-[#e4e4de]">
        <div
          v-for="(p, i) in products"
          :key="p.id"
          class="flex flex-wrap items-center gap-4 px-4 py-3.5"
          :class="i > 0 ? 'border-t border-[#e4e4de]' : ''"
        >
          <div class="min-w-[12rem] flex-1">
            <p class="text-[13px] text-[#121614]">{{ p.name }}</p>
            <p class="mt-0.5 text-[11px] text-[#8f9792]">{{ p.merchant }}</p>
          </div>
          <p class="text-[13px] font-medium text-[#121614]">₦{{ p.price.toLocaleString('en-NG') }}</p>
          <UiBadge tone="brand">Wallet accepted</UiBadge>
        </div>
      </div>
    </section>

    <UiCard class="mt-8 flex flex-wrap items-center justify-between gap-4 p-5">
      <div>
        <h3 class="text-[15px] font-semibold text-[#121614]">Open a storefront</h3>
        <p class="mt-1 text-[13px] text-[#606863]">
          Sell with the identity you already have. Payments settle to your wallet, online or not.
        </p>
      </div>
      <UiButton variant="secondary" size="sm">Join the waitlist</UiButton>
    </UiCard>
  </div>
</template>

<script setup>
import { merchants, products } from '~/data/commerce'

useHead({ title: 'Marketplace — Afronet' })
</script>
