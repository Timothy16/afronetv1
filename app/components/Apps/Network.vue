<!-- app/components/Apps/Network.vue -->

<!-- The Afronet Network app. Rendered by /network, and inside a workspace window with `embedded`. -->
<template>
  <div :class="embedded ? 'p-5' : 'mx-auto w-full max-w-6xl px-5 py-8'">
    <UiPageHeader
      v-if="!embedded"
      eyebrow="Connectivity layer"
      title="Afronet Network"
      description="Your device reaches Afronet through the people and places around it. No account, no tower, no permission needed."
    >
      <template #actions>
        <UiButton variant="secondary" size="sm">Network settings</UiButton>
      </template>
    </UiPageHeader>

    <div class="mt-6 grid gap-5 lg:grid-cols-3">
      <UiCard class="p-5 lg:col-span-2">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-tower-broadcast text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
              <h2 class="text-[15px] font-semibold text-[#121614]">
                {{ mode === 'offline' ? 'Searching for Afronet' : 'Connected to Afronet' }}
              </h2>
            </div>
            <p class="mt-1 text-[13px] text-[#606863]">{{ statusLine }}</p>
          </div>
          <UiBadge :tone="mode === 'offline' ? 'muted' : 'brand'">{{ modeCopy[mode].label }}</UiBadge>
        </div>

        <dl class="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div v-for="s in stats" :key="s.k">
            <dt class="text-[11px] text-[#8f9792]">{{ s.k }}</dt>
            <dd class="mt-0.5 text-[20px] font-semibold tracking-tight text-[#121614]">{{ s.v }}</dd>
          </div>
        </dl>

        <div class="mt-2 rounded-2xl bg-[#f7f7f4]">
          <NetworkMeshMap />
        </div>
        <p class="mt-3 text-center text-[12px] text-[#606863]">
          Your device is helping extend the Afronet network for 3 people nearby.
        </p>
      </UiCard>

      <div class="space-y-5">
        <UiCard class="p-5">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-microchip text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
            <h3 class="text-[14px] font-semibold text-[#121614]">AfroIntel available nearby</h3>
          </div>
          <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
            {{ aiHotspot.device }} is sharing <span class="text-[#121614]">{{ aiHotspot.model }}</span>, a larger model
            than this device can run. Powered by {{ aiHotspot.owner }}.
          </p>
          <div class="mt-3 flex items-center gap-3 text-[11px] text-[#8f9792]">
            <span>{{ aiHotspot.hops }} hop</span>
            <span>·</span>
            <span>{{ aiHotspot.latency }} response</span>
            <span>·</span>
            <span>End-to-end encrypted</span>
          </div>
          <UiButton class="mt-4" block>Connect to nearby intelligence</UiButton>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Extend Afronet" hint="Relay for people around you" />
          <div class="mt-3 divide-y divide-[#e4e4de]">
            <UiRow v-for="t in toggles" :key="t.key" :label="t.label" :hint="t.hint">
              <template #action>
                <UiToggle v-model="settings[t.key]" :label="t.label" />
              </template>
            </UiRow>
          </div>
          <div class="mt-4 flex items-center gap-2 rounded-xl bg-[#f7f7f4] p-3 text-[11px] text-[#606863]">
            <i class="fa-solid fa-battery-three-quarters shrink-0 text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
            Relaying used 4% of your battery today and moved 212 MB for other people.
          </div>
        </UiCard>
      </div>
    </div>

    <section class="mt-8">
      <UiSectionHeading
        title="Devices and nodes in range"
        hint="Afronet chooses the best path automatically — you never pick one."
      />
      <div class="mt-4 overflow-hidden rounded-2xl border border-[#e4e4de]">
        <div
          v-for="(d, i) in meshDevices"
          :key="d.id"
          class="flex flex-wrap items-center gap-4 px-4 py-3.5"
          :class="i > 0 ? 'border-t border-[#e4e4de]' : ''"
        >
          <span
            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            :class="d.strength === 0 ? 'bg-[#f7f7f4] text-[#8f9792]' : 'bg-[#eaf3ee] text-[#0b5d3e]'"
          >
            <i class="fa-solid text-[14px]" :class="kindIcon[d.kind]" aria-hidden="true"></i>
          </span>
          <div class="min-w-[10rem] flex-1">
            <p class="flex items-center gap-2 text-[13px] font-medium text-[#121614]">
              {{ d.label }}
              <UiComingSoon
                v-if="d.phase && d.phase !== 'v1'"
                :label="d.phase === 'future' ? 'Future' : 'Coming soon'"
              />
            </p>
            <p class="mt-0.5 text-[12px] text-[#606863]">
              {{ d.owner }} · {{ d.hops }} hop{{ d.hops > 1 ? 's' : '' }} away
            </p>
          </div>
          <div class="hidden flex-wrap gap-1.5 sm:flex">
            <span
              v-for="s in d.sharing"
              :key="s"
              class="rounded-full border border-[#e4e4de] px-2 py-0.5 text-[11px] text-[#606863]"
            >
              {{ s }}
            </span>
          </div>
          <div class="w-24">
            <UiProgress v-if="d.strength > 0" :value="d.strength" :tone="d.kind === 'node' ? 'gold' : 'brand'" />
            <span v-else class="text-[11px] text-[#8f9792]">Not yet reachable</span>
          </div>
        </div>
      </div>
    </section>

    <section class="mt-8 grid gap-4 sm:grid-cols-3">
      <UiCard v-for="f in futures" :key="f.title" class="p-5">
        <div class="flex items-center justify-between">
          <h3 class="text-[14px] font-semibold text-[#121614]">{{ f.title }}</h3>
          <UiComingSoon />
        </div>
        <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">{{ f.body }}</p>
      </UiCard>
    </section>

    <div
      class="mt-8 flex items-start gap-3 rounded-2xl border border-[#e4e4de] bg-[#f7f7f4] p-4 text-[12px] leading-relaxed text-[#606863]"
    >
      <i class="fa-solid fa-shield-halved mt-0.5 shrink-0 text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
      Relayed traffic is encrypted end to end. Devices that pass your messages along cannot read them, and your
      African ID is never exposed to intermediate hops.
    </div>
  </div>
</template>

<script setup>
import { aiHotspot, meshDevices, modeCopy } from '~/data/network'

defineProps({
  embedded: { type: Boolean, default: false },
})

const { mode } = useAfronet()

const settings = reactive({ relay: true, nearby: true, battery: true, hotspot: false, shareAI: false })

const toggles = [
  { key: 'relay', label: 'Help extend Afronet', hint: 'Turn this device into a relay' },
  { key: 'nearby', label: 'Allow nearby users', hint: 'Anyone within range may connect' },
  { key: 'battery', label: 'Battery protection', hint: 'Pause relaying below 25%' },
  { key: 'hotspot', label: 'Hotspot mode', hint: 'Share your connection widely' },
  { key: 'shareAI', label: 'Share AfroIntel', hint: 'Let nearby devices use your model' },
]

const stats = [
  { k: 'Connected devices', v: '12' },
  { k: 'Nearby', v: '8' },
  { k: 'Network reach', v: 'Good' },
  { k: 'Relaying for', v: '3 people' },
]

const futures = [
  {
    title: 'Community servers',
    body: 'Schools, clinics and businesses hosting Afronet storage and services for their area.',
  },
  {
    title: 'Internet gateways',
    body: 'Bridges that carry queued mail, payments and sync out to the wider internet.',
  },
  {
    title: 'Airship nodes',
    body: 'High-altitude relays covering regions with no ground infrastructure at all.',
  },
]

const kindIcon = {
  phone: 'fa-mobile-screen',
  laptop: 'fa-laptop',
  node: 'fa-tower-cell',
  gateway: 'fa-share-from-square',
  airship: 'fa-plane',
}

const statusLine = computed(() =>
  mode.value === 'offline'
    ? 'No peers in range yet. Everything on this device still works.'
    : `Connected through Afronet Node — Jalingo. Internet ${
        mode.value === 'both' || mode.value === 'internet' ? 'available.' : 'unavailable.'
      }`,
)
</script>
