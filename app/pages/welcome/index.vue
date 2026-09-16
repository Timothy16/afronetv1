<!-- app/pages/welcome/index.vue -->

<!--
  Onboarding, outside the shell. Four stages in one page, as in the design:
  welcome → sign in, or welcome → register → a seven-step device setup.
-->
<template>
  <div>
    <!-- Welcome -->
    <div v-if="stage === 'welcome'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
      <div class="rise w-full max-w-md text-center">
        <BrandMark :size="44" class="mx-auto" />
        <h1 class="mt-6 font-['Instrument_Serif',Georgia,serif] text-[38px] leading-tight text-[#121614]">
          Welcome to Afronet
        </h1>
        <p class="mt-3 text-[15px] leading-relaxed text-[#606863]">
          One identity. One African network. A new digital world — with or without the internet.
        </p>
        <div class="mt-8 space-y-2.5">
          <UiButton block size="lg" @click="stage = 'register'">Create African ID</UiButton>
          <UiButton block size="lg" variant="secondary" @click="stage = 'signin'">Sign in</UiButton>
        </div>
        <p class="mt-8 text-[12px] leading-relaxed text-[#8f9792]">
          Afronet is downloaded directly from afronet.africa — for Android, iOS, Windows, macOS and Linux. No app
          store required.
        </p>
      </div>
    </div>

    <!-- Sign in -->
    <div v-else-if="stage === 'signin'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
      <div class="w-full max-w-sm">
        <BrandLogo class="mb-8" />
        <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">Sign in</h1>
        <p class="mt-1.5 text-[13px] text-[#606863]">Your African ID unlocks every Afronet service.</p>
        <div class="mt-6 space-y-4">
          <UiField label="African ID or username">
            <UiInput v-model="signinId" placeholder="@elijah" />
          </UiField>
          <UiField label="PIN">
            <UiInput v-model="signinPin" type="password" placeholder="6 digits" />
          </UiField>
          <UiButton block @click="go('/')">Sign in</UiButton>
          <button class="flex w-full items-center justify-center gap-2 text-[13px] text-[#606863] hover:text-[#121614]">
            <i class="fa-solid fa-fingerprint text-[14px]" aria-hidden="true"></i>
            Use fingerprint on this device
          </button>
        </div>
        <button class="mt-8 text-[12px] text-[#8f9792] hover:text-[#121614]" @click="stage = 'welcome'">Back</button>
      </div>
    </div>

    <!-- Register -->
    <div v-else-if="stage === 'register'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-16">
      <div class="w-full max-w-md">
        <BrandLogo class="mb-8" />
        <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
          Create your African ID
        </h1>
        <p class="mt-1.5 text-[13px] text-[#606863]">Six fields. Once it exists, every Afronet service recognises you.</p>
        <div class="mt-6 space-y-4">
          <UiField label="Full name">
            <UiInput placeholder="Elijah Adeyemi" />
          </UiField>
          <UiField label="Username" hint="This becomes your address for calls, mail and payments.">
            <UiInput placeholder="@elijah" />
          </UiField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiField label="Country">
              <UiInput placeholder="Nigeria" />
            </UiField>
            <UiField label="Phone or email">
              <UiInput placeholder="Optional" />
            </UiField>
          </div>
          <UiField label="PIN" hint="Used for sign-in and to approve payments.">
            <UiInput type="password" placeholder="6 digits" />
          </UiField>
          <label class="flex items-center gap-3 rounded-xl border border-[#e4e4de] p-3">
            <i class="fa-solid fa-fingerprint text-[18px] text-[#0b5d3e]" aria-hidden="true"></i>
            <span class="flex-1 text-[13px] text-[#121614]">Enable fingerprint on this device</span>
            <!-- Always on in the design: the switch shows the default, it does not toggle. -->
            <UiToggle :model-value="true" label="Fingerprint" />
          </label>
          <UiButton block @click="stage = 'setup'">Create African ID</UiButton>
          <p class="text-center text-[11px] leading-relaxed text-[#8f9792]">
            Your keys are generated on this device. Afronet cannot read your messages, files or AI conversations.
          </p>
        </div>
      </div>
    </div>

    <!-- Setup -->
    <div v-else class="mx-auto w-full max-w-2xl px-5 py-12">
      <BrandLogo class="mb-8" />
      <p class="text-[12px] text-[#8f9792]">Step {{ step }} of {{ setupSteps.length }}</p>
      <h1 class="mt-1 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
        {{ setupSteps[step - 1] }}
      </h1>
      <UiProgress :value="pct" class="mt-4" />

      <UiCard class="mt-6 p-6">
        <!-- 1 · African ID -->
        <div v-if="step === 1" class="flex items-center gap-4">
          <i class="fa-solid fa-shield-halved shrink-0 text-[32px] text-[#0b5d3e]" aria-hidden="true"></i>
          <div>
            <p class="text-[15px] font-medium text-[#121614]">African ID created</p>
            <p class="mt-1 text-[13px] text-[#606863]">
              @elijah · AF-NG-4827-1193 · verified on this device. Powered by DCI.
            </p>
          </div>
        </div>

        <!-- 2 · Device capability -->
        <div v-else-if="step === 2">
          <div class="flex items-center gap-3">
            <i class="fa-solid fa-microchip text-[18px] text-[#0b5d3e]" aria-hidden="true"></i>
            <p class="text-[15px] font-medium text-[#121614]">{{ device.name }}</p>
          </div>
          <dl class="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div v-for="s in deviceStats" :key="s.k">
              <dt class="text-[11px] text-[#8f9792]">{{ s.k }}</dt>
              <dd class="mt-0.5 text-[13px] text-[#121614]">{{ s.v }}</dd>
            </div>
          </dl>
          <p class="mt-4 rounded-xl bg-[#f7f7f4] p-3 text-[13px] text-[#606863]">
            This device can run <span class="text-[#121614]">AfroIntel Core</span> comfortably.
          </p>
        </div>

        <!-- 3 · Download AfroIntel -->
        <div v-else-if="step === 3" class="space-y-3">
          <div
            v-for="m in models.slice(0, 3)"
            :key="m.id"
            class="flex items-center gap-4 rounded-xl border p-4"
            :class="m.id === 'core' ? 'border-[#0b5d3e] bg-[#eaf3ee]/40' : 'border-[#e4e4de]'"
          >
            <i class="fa-solid fa-download shrink-0 text-[14px] text-[#606863]" aria-hidden="true"></i>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-medium text-[#121614]">{{ m.name }}</p>
              <p class="text-[12px] text-[#606863]">{{ m.size }} · needs {{ m.ram }} RAM · {{ m.speed }}</p>
            </div>
            <UiBadge v-if="m.id === 'core'" tone="brand">Recommended</UiBadge>
            <UiBadge v-if="m.state === 'unsupported'" tone="muted">Too large</UiBadge>
          </div>
        </div>

        <!-- 4 · AI modules -->
        <div v-else-if="step === 4" class="grid gap-2 sm:grid-cols-2">
          <button
            v-for="m in modules.slice(0, 6)"
            :key="m.id"
            class="flex items-start gap-3 rounded-xl border p-3 text-left transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            :class="picked.includes(m.id) ? 'border-[#0b5d3e] bg-[#eaf3ee]/40' : 'border-[#e4e4de]'"
            @click="picked = toggle(picked, m.id)"
          >
            <span
              class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded"
              :class="picked.includes(m.id) ? 'bg-[#0b5d3e] text-[#ffffff]' : 'border border-[#e4e4de]'"
            >
              <i v-if="picked.includes(m.id)" class="fa-solid fa-check text-[10px]" aria-hidden="true"></i>
            </span>
            <span class="min-w-0">
              <span class="block text-[13px] font-medium text-[#121614]">{{ m.name }}</span>
              <span class="block text-[11px] text-[#8f9792]">{{ m.size }}</span>
            </span>
          </button>
        </div>

        <!-- 5 · Network permissions -->
        <div v-else-if="step === 5" class="space-y-3">
          <div v-for="p in permissionRows" :key="p.k" class="flex items-center gap-4 rounded-xl border border-[#e4e4de] p-4">
            <i class="fa-solid fa-tower-broadcast shrink-0 text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] text-[#121614]">{{ p.label }}</p>
              <p class="text-[12px] text-[#606863]">{{ p.hint }}</p>
            </div>
            <UiToggle v-model="perms[p.k]" :label="p.label" />
          </div>
        </div>

        <!-- 6 · People nearby -->
        <div v-else-if="step === 6">
          <p class="mb-3 flex items-center gap-2 text-[13px] text-[#606863]">
            <i class="fa-solid fa-users text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
            {{ reachable.length }} Afronet users are reachable around you
          </p>
          <div class="space-y-2">
            <div
              v-for="c in reachable.slice(0, 4)"
              :key="c.id"
              class="flex items-center gap-3 rounded-xl border border-[#e4e4de] p-3"
            >
              <UiAvatar :src="c.avatar" :name="c.name" :size="34" :presence="c.presence" />
              <div class="min-w-0 flex-1">
                <p class="truncate text-[13px] text-[#121614]">{{ c.name }}</p>
                <p class="text-[11px] text-[#8f9792]">
                  {{ c.username }} · {{ c.hops ? `${c.hops} hop away` : 'via gateway' }}
                </p>
              </div>
              <UiButton size="sm" variant="secondary">Add</UiButton>
            </div>
          </div>
        </div>

        <!-- 7 · Pin your apps -->
        <div v-else class="grid grid-cols-3 gap-2 sm:grid-cols-4">
          <button
            v-for="a in apps.slice(0, 12)"
            :key="a.id"
            class="flex flex-col items-center gap-2 rounded-xl border p-3 transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
            :class="pins.includes(a.id) ? 'border-[#0b5d3e] bg-[#eaf3ee]/40' : 'border-[#e4e4de]'"
            @click="pins = toggle(pins, a.id)"
          >
            <ShellAppIcon :name="a.icon" :class="pins.includes(a.id) ? 'text-[#0b5d3e]' : 'text-[#606863]'" />
            <span class="text-center text-[11px] text-[#121614]">{{ a.name }}</span>
          </button>
        </div>
      </UiCard>

      <div class="mt-6 flex items-center justify-between">
        <button class="text-[13px] text-[#606863] hover:text-[#121614]" @click="back">Back</button>
        <UiButton @click="next">{{ step === setupSteps.length ? 'Enter Afronet' : 'Continue' }}</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { apps } from '~/data/apps'
import { device, models, modules } from '~/data/models'
import { contacts } from '~/data/people'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Welcome to Afronet' })

const setupSteps = [
  'Create your African ID',
  'Check device capability',
  'Download AfroIntel',
  'Choose AI modules',
  'Network permissions',
  'Find people nearby',
  'Pin your apps',
]

const permissionRows = [
  { k: 'mesh', label: 'Join the Afronet mesh', hint: 'Connect to nearby devices and nodes' },
  { k: 'nearby', label: 'Let others relay through you', hint: 'Optional, and battery protected' },
  { k: 'notifications', label: 'Notifications', hint: 'Messages, transfers and network events' },
]

const deviceStats = [
  { k: 'RAM', v: device.ram },
  { k: 'Storage free', v: device.free },
  { k: 'Processor', v: device.processor },
  { k: 'AI capability', v: '★★★★☆' },
]

// welcome | signin | register | setup
const stage = ref('welcome')
const step = ref(1)
const picked = ref(['m2', 'm3'])
const pins = ref(['ai', 'messages', 'mesh', 'files'])
const perms = reactive({ mesh: true, nearby: true, notifications: true })

const signinId = ref('@elijah')
const signinPin = ref('••••••')

const pct = computed(() => (step.value / setupSteps.length) * 100)
const reachable = contacts.filter((c) => c.presence !== 'offline')

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

const go = (path) => navigateTo(path)

const back = () => {
  if (step.value === 1) stage.value = 'register'
  else step.value -= 1
}

const next = () => {
  if (step.value === setupSteps.length) navigateTo('/')
  else step.value += 1
}
</script>

<style scoped>
.rise {
  animation: rise 0.3s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rise {
    animation: none;
  }
}
</style>
