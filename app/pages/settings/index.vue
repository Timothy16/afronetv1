<!-- app/pages/settings/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="System"
      title="Settings"
      description="Everything Afronet does on your behalf — identity, intelligence, network, privacy — in one place."
    />

    <div class="mt-6 grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)]">
      <nav class="h-fit space-y-0.5 lg:sticky lg:top-20">
        <button
          v-for="s in sections"
          :key="s.id"
          class="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="active === s.id ? 'bg-[#eaf3ee] font-medium text-[#0b5d3e]' : 'text-[#606863] hover:bg-[#f7f7f4]'"
          @click="active = s.id"
        >
          <i class="fa-solid w-4 text-center text-[14px]" :class="s.icon" aria-hidden="true"></i>
          {{ s.label }}
        </button>
      </nav>

      <div class="space-y-6">
        <!-- Account -->
        <UiCard v-if="active === 'account'" class="p-5">
          <UiSectionHeading title="African ID" hint="Powered by DCI" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Name" :value="me.name" />
            <UiRow label="Username" :value="me.username" />
            <UiRow label="African ID" :value="me.africanId" />
            <UiRow label="Country" :value="me.country" />
            <UiRow label="Verification">
              <template #value><UiBadge tone="brand">Verified</UiBadge></template>
            </UiRow>
            <UiRow label="PIN & biometrics" value="Fingerprint + 6-digit PIN" />
            <UiRow label="Trusted devices" value="3 devices" />
            <UiRow label="Active sessions" value="2 sessions" />
          </div>
          <UiButton variant="danger" size="sm" class="mt-4">Sign out of all devices</UiButton>
        </UiCard>

        <!-- AfroIntel -->
        <template v-else-if="active === 'ai'">
          <UiCard class="p-5">
            <UiSectionHeading title="Model" :hint="`${device.name} · ${device.ram} RAM`" />
            <div class="mt-2 divide-y divide-[#e4e4de]">
              <UiRow label="Current model" value="AfroIntel Lite" />
              <UiRow label="Downloading" value="AfroIntel Core · 78%" />
              <UiRow label="Installed modules" :value="`${installedModules} of ${modules.length}`" />
              <UiRow label="Model storage" value="0.9 GB" />
              <UiRow label="Performance mode" hint="Balances speed against battery" value="Balanced" />
              <UiRow label="Let AfroIntel use nearby models" hint="Uses a neighbour's larger model when offered">
                <template #action><UiToggle v-model="flags.nearby" label="Nearby models" /></template>
              </UiRow>
              <UiRow label="Send AI data off device" hint="Off — conversations stay local">
                <template #action><UiToggle v-model="flags.aiData" label="AI data" /></template>
              </UiRow>
            </div>
            <div class="mt-4 flex gap-2">
              <UiButton size="sm" variant="secondary">Download models</UiButton>
              <UiButton size="sm" variant="ghost">AI modules</UiButton>
            </div>
          </UiCard>
          <UiCard class="p-5">
            <UiSectionHeading title="Available models" />
            <div class="mt-2 divide-y divide-[#e4e4de]">
              <UiRow v-for="m in models" :key="m.id" :label="m.name" :hint="`${m.size} · needs ${m.ram} RAM`">
                <template #value>
                  <UiBadge v-if="m.state === 'installed'" tone="brand">Installed</UiBadge>
                  <UiBadge v-else-if="m.state === 'unsupported'" tone="muted">Not supported</UiBadge>
                  <UiBadge v-else-if="m.state === 'downloading'" tone="gold">78%</UiBadge>
                  <UiBadge v-else tone="outline">Available</UiBadge>
                </template>
              </UiRow>
            </div>
          </UiCard>
        </template>

        <!-- Network -->
        <UiCard v-else-if="active === 'network'" class="p-5">
          <UiSectionHeading title="Afronet connection" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Mesh networking">
              <template #action><UiToggle v-model="flags.mesh" label="Mesh" /></template>
            </UiRow>
            <UiRow label="Hotspot mode" hint="Share your path with others">
              <template #action><UiToggle v-model="flags.hotspot" label="Hotspot" /></template>
            </UiRow>
            <UiRow label="Allow nearby devices">
              <template #action><UiToggle v-model="flags.nearby" label="Nearby devices" /></template>
            </UiRow>
            <UiRow label="Share data allowance" hint="Cap 500 MB per day">
              <template #action><UiToggle v-model="flags.dataShare" label="Data sharing" /></template>
            </UiRow>
            <UiRow label="Wi-Fi Direct">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
            </UiRow>
            <UiRow label="Bluetooth fallback">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
            </UiRow>
            <UiRow label="Internet gateways">
              <template #value><UiComingSoon /></template>
            </UiRow>
          </div>
        </UiCard>

        <!-- Privacy -->
        <UiCard v-else-if="active === 'privacy'" class="p-5">
          <UiSectionHeading title="Permissions" hint="You can always see who has access to what" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Contacts" hint="Used to find who is reachable">
              <template #value><UiBadge tone="brand">Allowed</UiBadge></template>
            </UiRow>
            <UiRow label="Location">
              <template #action><UiToggle v-model="flags.location" label="Location" /></template>
            </UiRow>
            <UiRow label="Camera">
              <template #action><UiToggle v-model="flags.camera" label="Camera" /></template>
            </UiRow>
            <UiRow label="Microphone">
              <template #action><UiToggle v-model="flags.mic" label="Microphone" /></template>
            </UiRow>
            <UiRow label="Files" hint="AfroIntel may read files you attach">
              <template #value><UiBadge tone="brand">On request</UiBadge></template>
            </UiRow>
            <UiRow label="Social visibility">
              <template #action><UiToggle v-model="flags.socialVisible" label="Social visibility" /></template>
            </UiRow>
          </div>
        </UiCard>

        <!-- Notifications -->
        <UiCard v-else-if="active === 'notifications'" class="p-5">
          <UiSectionHeading title="Notifications" hint="One system across every Afronet app" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow v-for="[k, label] in notificationRows" :key="k" :label="label">
              <template #action><UiToggle v-model="flags[k]" :label="label" /></template>
            </UiRow>
          </div>
        </UiCard>

        <!-- Storage -->
        <UiCard v-else-if="active === 'storage'" class="p-5">
          <UiSectionHeading title="Storage" :hint="`${storage.device.used} of ${storage.device.total} GB used`" />
          <UiProgress :value="(storage.device.used / storage.device.total) * 100" class="mt-4" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow v-for="b in storage.breakdown" :key="b.label" :label="b.label" :value="`${b.value} GB`" />
            <UiRow label="Downloads" value="12.4 GB" />
          </div>
          <UiButton size="sm" variant="secondary" class="mt-4">Clear cache</UiButton>
        </UiCard>

        <!-- Appearance — light only, so the design's light/dark switch is not carried over. -->
        <UiCard v-else-if="active === 'appearance'" class="p-5">
          <UiSectionHeading title="Appearance" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Text size" value="Default" />
            <UiRow label="Reduce motion" hint="Follows your system setting">
              <template #value><UiBadge tone="brand">System</UiBadge></template>
            </UiRow>
            <UiRow label="High contrast">
              <template #value><UiBadge tone="muted">Off</UiBadge></template>
            </UiRow>
          </div>
        </UiCard>

        <!-- Language -->
        <UiCard v-else-if="active === 'language'" class="p-5">
          <UiSectionHeading title="Language" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Interface language" value="English" />
            <UiRow label="AfroIntel language" value="English · Hausa" />
            <UiRow label="Automatic translation">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
            </UiRow>
            <UiRow label="Installed language packs" value="24 African languages" />
          </div>
        </UiCard>

        <!-- Wallet -->
        <UiCard v-else-if="active === 'wallet'" class="p-5">
          <UiSectionHeading title="Wallet" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow label="Transaction PIN">
              <template #value><UiBadge tone="brand">Set</UiBadge></template>
            </UiRow>
            <UiRow label="Biometric approval">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
            </UiRow>
            <UiRow label="Monthly limit" value="₦2,000,000" />
            <UiRow label="Payment methods" value="1 linked account" />
            <UiRow label="Offline signing" hint="Approve now, settle at a gateway">
              <template #value><UiBadge tone="brand">On</UiBadge></template>
            </UiRow>
          </div>
        </UiCard>

        <!-- Apps -->
        <UiCard v-else class="p-5">
          <UiSectionHeading title="Installed applications" />
          <div class="mt-2 divide-y divide-[#e4e4de]">
            <UiRow v-for="a in apps" :key="a.id" :label="a.name" :hint="a.blurb">
              <template #value>
                <UiBadge v-if="a.phase === 'v1'" tone="brand">V1</UiBadge>
                <UiComingSoon v-else />
              </template>
            </UiRow>
          </div>
        </UiCard>
      </div>
    </div>
  </div>
</template>

<script setup>
import { apps } from '~/data/apps'
import { storage } from '~/data/files'
import { device, models, modules } from '~/data/models'
import { me } from '~/data/people'

useHead({ title: 'Settings — Afronet' })

const sections = [
  { id: 'account', label: 'Account', icon: 'fa-user' },
  { id: 'ai', label: 'AfroIntel', icon: 'fa-microchip' },
  { id: 'network', label: 'Network', icon: 'fa-tower-broadcast' },
  { id: 'privacy', label: 'Privacy', icon: 'fa-lock' },
  { id: 'notifications', label: 'Notifications', icon: 'fa-bell' },
  { id: 'storage', label: 'Storage', icon: 'fa-hard-drive' },
  { id: 'appearance', label: 'Appearance', icon: 'fa-palette' },
  { id: 'language', label: 'Language', icon: 'fa-language' },
  { id: 'wallet', label: 'Wallet', icon: 'fa-wallet' },
  { id: 'apps', label: 'Apps', icon: 'fa-window-maximize' },
]

const active = ref('account')

const flags = reactive({
  mesh: true,
  hotspot: false,
  nearby: true,
  dataShare: true,
  location: false,
  camera: true,
  mic: true,
  aiData: false,
  socialVisible: true,
  nMessages: true,
  nCalls: true,
  nMail: true,
  nWallet: true,
  nSocial: false,
  nSystem: true,
})

const notificationRows = [
  ['nMessages', 'Messages'],
  ['nCalls', 'Calls'],
  ['nMail', 'Email'],
  ['nWallet', 'Wallet'],
  ['nSocial', 'Social'],
  ['nSystem', 'System and network'],
]

const installedModules = modules.filter((m) => m.installed).length
</script>
