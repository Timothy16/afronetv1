<!-- app/pages/welcome/index.vue -->

<!--
  Onboarding, outside the shell: welcome → sign in, or
  welcome → email → (verify link, /welcome/verify/:token) → register.
  The seven-step device setup after register is commented out for now.
-->
<template>
  <div>
    <!-- Welcome -->
    <div v-if="stage === 'welcome'" class="min-h-[100dvh] w-full bg-[#ffffff] lg:grid lg:grid-cols-2">
      <!-- Greeting panel: full width on a phone, the left half on a desktop -->
      <div class="lg:flex lg:flex-col lg:justify-center">
        <LandingGreeting class="lg:min-h-[100dvh] lg:justify-center" />
      </div>

      <div class="flex items-center justify-center px-5 py-12 sm:py-16">
        <div class="rise w-full max-w-md">
          <h1 class="font-['Instrument_Serif',Georgia,serif] text-[32px] leading-tight text-[#121614] sm:text-[38px]">
            {{ welcomeIntro.title }}
          </h1>
          <p class="mt-3 text-[15px] leading-relaxed text-[#606863]">{{ welcomeIntro.body }}</p>

          <div class="mt-8 space-y-2.5">
            <UiButton block size="lg" @click="setStage('register')">Create African ID</UiButton>
            <UiButton block size="lg" variant="secondary" @click="setStage('signin')">Sign in</UiButton>
          </div>

          <p class="mt-8 text-[12px] leading-relaxed text-[#8f9792]">
            Afronet is downloaded directly from afronet.africa — for Android, iOS, Windows, macOS and Linux. No app
            store required.
          </p>

          <NuxtLink
            to="/"
            class="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#606863] transition-colors duration-150 hover:text-[#121614]"
          >
            <i class="fa-solid fa-arrow-left text-[11px]" aria-hidden="true"></i>
            Back to afronet.africa
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Sign in -->
    <div v-else-if="stage === 'signin'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
      <div class="w-full max-w-sm">
        <BrandLogo class="mb-8" />
        <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">Sign in</h1>
        <p class="mt-1.5 text-[13px] text-[#606863]">Your African ID unlocks every Afronet service.</p>
        <form class="mt-6 space-y-4" novalidate @submit.prevent="signIn">
          <UiField label="Email or username">
            <UiInput v-model="signin.identifier" autocomplete="username" placeholder="you@example.com or @elijah" />
          </UiField>
          <UiField label="Password">
            <UiPasswordInput v-model="signin.password" autocomplete="current-password" placeholder="Your password" />
          </UiField>
          <p v-if="formError" class="text-[13px] text-[#b22c26]" role="alert">{{ formError }}</p>
          <UiButton block type="submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Signing in…' : 'Sign in' }}
          </UiButton>
        </form>
        <p class="mt-6 text-center text-[13px] text-[#606863]">
          New to Afronet?
          <button type="button" class="font-medium text-[#0b5d3e] hover:underline" @click="setStage('email')">
            Create African ID
          </button>
        </p>
        <button type="button" class="mt-8 text-[12px] text-[#8f9792] hover:text-[#121614]" @click="setStage('welcome')">
          Back
        </button>
      </div>
    </div>

    <!-- Sign up · email — not used in new flow (no email verification step)
    <div v-else-if="stage === 'email'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
      <div class="w-full max-w-sm">
        <BrandLogo class="mb-8" />
        <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
          Create your African ID
        </h1>
        <p class="mt-1.5 text-[13px] text-[#606863]">Start with your email. We'll send a link to verify it.</p>
        <form class="mt-6 space-y-4" novalidate @submit.prevent="sendLink">
          <UiField label="Email">
            <UiInput v-model="signupEmail" type="email" autocomplete="email" placeholder="you@example.com" />
          </UiField>
          <p v-if="formError" class="text-[13px] text-[#b22c26]" role="alert">{{ formError }}</p>
          <UiButton block type="submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Sending…' : 'Send verification link' }}
          </UiButton>
        </form>
        <p class="mt-6 text-center text-[13px] text-[#606863]">
          Already have an African ID?
          <button type="button" class="font-medium text-[#0b5d3e] hover:underline" @click="setStage('signin')">
            Sign in
          </button>
        </p>
        <button type="button" class="mt-8 text-[12px] text-[#8f9792] hover:text-[#121614]" @click="setStage('welcome')">
          Back
        </button>
      </div>
    </div>

    Sign up · check inbox — not used in new flow (no email verification step)
    <div v-else-if="stage === 'sent'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-20">
      <div class="w-full max-w-sm text-center">
        <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#eaf3ee]">
          <i class="fa-solid fa-envelope-open-text text-[18px] text-[#0b5d3e]" aria-hidden="true"></i>
        </span>
        <h1 class="mt-6 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
          Check your inbox
        </h1>
        <p class="mt-3 text-[13px] leading-relaxed text-[#606863]">
          We sent a verification link to <span class="font-medium text-[#121614]">{{ signupEmail }}</span>.
          Click it to continue creating your African ID. The link expires in 24 hours.
        </p>
        <p v-if="notice" class="mt-4 text-[13px] text-[#0b5d3e]" role="status">{{ notice }}</p>
        <p v-if="formError" class="mt-4 text-[13px] text-[#b22c26]" role="alert">{{ formError }}</p>
        <div class="mt-8 space-y-2.5">
          <UiButton block @click="continueAfterVerify">I've verified — continue</UiButton>
          <UiButton block variant="secondary" :disabled="userStore.loading || cooldown > 0" @click="resendLink">
            {{ cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email' }}
          </UiButton>
        </div>
        <button type="button" class="mt-8 text-[12px] text-[#8f9792] hover:text-[#121614]" @click="setStage('email')">
          Use a different email
        </button>
      </div>
    </div>
    -->

    <!-- Register -->
    <div v-else-if="stage === 'register'" class="flex min-h-[100dvh] w-full items-center justify-center bg-[#ffffff] px-5 py-16">
      <div class="w-full max-w-md">
        <BrandLogo class="mb-8" />
        <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
          Create your African ID
        </h1>
        <p class="mt-1.5 text-[13px] text-[#606863]">Once it exists, every Afronet service recognises you.</p>
        <form class="mt-6 space-y-4" novalidate @submit.prevent="createAccount">
          <!-- Profile photo: uploads to GCS as soon as it's picked; the form sends only the path -->
          <!-- HIDDEN: profile photo upload not needed in new registration flow
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-[#e4e4de] bg-[#f7f7f4] transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]"
              aria-label="Choose profile photo"
              :disabled="uploading"
              @click="avatarInput?.click()"
            >
              <img v-if="avatarPreview" :src="avatarPreview" alt="" class="h-full w-full object-cover" />
              <i v-else class="fa-solid fa-camera text-[18px] text-[#8f9792]" aria-hidden="true"></i>
              <span
                v-if="uploading"
                class="absolute inset-0 flex items-center justify-center bg-[#121614]/55 text-[11px] font-medium text-[#ffffff]"
              >
                {{ progress }}%
              </span>
            </button>
            <div class="min-w-0">
              <p class="text-[13px] font-medium text-[#121614]">Profile photo</p>
              <p class="text-[12px] text-[#8f9792]">Optional · JPG, PNG, WEBP or GIF, up to 5MB</p>
              <div class="mt-1 flex gap-3 text-[12px]">
                <button
                  type="button"
                  class="font-medium text-[#0b5d3e] hover:underline disabled:opacity-40"
                  :disabled="uploading"
                  @click="avatarInput?.click()"
                >
                  {{ avatarPreview ? 'Change' : 'Upload photo' }}
                </button>
                <button
                  v-if="avatarPreview && !uploading"
                  type="button"
                  class="text-[#606863] hover:text-[#121614]"
                  @click="removeAvatar"
                >
                  Remove
                </button>
              </div>
              <p v-if="avatarError" class="mt-1 text-[12px] text-[#b22c26]" role="alert">{{ avatarError }}</p>
            </div>
            <input
              ref="avatarInput"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="hidden"
              @change="pickAvatar"
            />
          </div>
          -->

          <div class="grid gap-4 sm:grid-cols-2">
            <UiField label="First name">
              <UiInput v-model="register.firstName" autocomplete="given-name" placeholder="Elijah" />
            </UiField>
            <UiField label="Last name">
              <UiInput v-model="register.lastName" autocomplete="family-name" placeholder="Adeyemi" />
            </UiField>
          </div>
          <!-- HIDDEN: username field not used in new registration flow
          <UiField label="Username" hint="Letters, numbers, dots and underscores. This becomes your address for calls, mail and payments.">
            <div class="relative">
              <span class="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-[#8f9792]">@</span>
              <UiInput
                v-model="register.username"
                class="pl-8"
                autocomplete="username"
                autocapitalize="off"
                spellcheck="false"
                placeholder="elijah"
              />
            </div>
          </UiField>
          -->

          <!-- HIDDEN: verified email display replaced with plain email input
          <UiField label="Email" hint="Verified. This is where Afronet will reach you.">
            <div class="flex h-11 items-center gap-2 rounded-xl border border-[#e4e4de] bg-[#f7f7f4] px-3.5 text-sm text-[#121614]">
              <i class="fa-solid fa-circle-check text-[13px] text-[#0b5d3e]" aria-hidden="true"></i>
              <span class="min-w-0 flex-1 truncate">{{ verifiedEmail }}</span>
              <button type="button" class="text-[12px] text-[#606863] hover:text-[#121614]" @click="setStage('email')">
                Change
              </button>
            </div>
          </UiField>
          -->
          <UiField label="Email">
            <UiInput v-model="register.email" type="email" autocomplete="email" placeholder="you@example.com" />
          </UiField>

          <UiField label="Password" hint="At least 8 characters.">
            <UiPasswordInput v-model="register.password" autocomplete="new-password" placeholder="Create a password" />
          </UiField>

          <UiField label="Institution / University">
            <UiInput v-model="register.institution" autocomplete="organization" placeholder="University of Lagos" />
          </UiField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UiField label="Country">
              <UiInput v-model="register.country" autocomplete="country-name" placeholder="Nigeria" />
            </UiField>
            <UiField label="City">
              <UiInput v-model="register.city" autocomplete="address-level2" placeholder="Lagos" />
            </UiField>
          </div>

          <!-- HIDDEN: country dropdown replaced with free text in new flow; phone removed
          <div class="grid gap-4 sm:grid-cols-2">
            <UiField label="Country (optional)">
              <UiSelect
                v-model="register.countryId"
                :options="misc.countries"
                :placeholder="misc.countries.length ? 'Select country' : 'Loading…'"
                :disabled="!misc.countries.length"
              />
            </UiField>
            <UiField label="Phone">
              <UiInput v-model="register.phone" type="tel" autocomplete="tel" placeholder="+234 803 123 4567" />
            </UiField>
          </div>
          -->

          <p v-if="formError" class="text-[13px] text-[#b22c26]" role="alert">{{ formError }}</p>
          <UiButton block type="submit" :disabled="userStore.loading">
            {{ userStore.loading ? 'Creating…' : 'Create African ID' }}
          </UiButton>
          <p class="text-center text-[11px] leading-relaxed text-[#8f9792]">
            Your keys are generated on this device. Afronet cannot read your messages, files or AI conversations.
          </p>
        </form>
        <p class="mt-6 text-center text-[13px] text-[#606863]">
          Already have an African ID?
          <button type="button" class="font-medium text-[#0b5d3e] hover:underline" @click="setStage('signin')">
            Sign in
          </button>
        </p>
      </div>
    </div>

    <!-- Guided setup around account creation: intro, then the form, then device fit,
         model choice, download and the hand-off to the chat. -->
    <OnboardingIntro v-else-if="stage === 'intro'" @done="setStage('register')" />
    <OnboardingDeviceFit v-else-if="stage === 'devicefit'" @next="setStage('models')" />
    <OnboardingModelChoice
      v-else-if="stage === 'models'"
      @download="(key) => { chosenModel = key; setStage('download') }"
      @skip="goToChat"
    />
    <OnboardingModelDownload
      v-else-if="stage === 'download'"
      :model-id="chosenModel"
      @done="setStage('ready')"
      @skip="goToChat"
    />
    <OnboardingModelReady v-else-if="stage === 'ready'" :model-id="chosenModel" />

    <!--
      Setup (steps 1–7) — not needed yet. After register the user goes straight to "/".
      Restore by uncommenting this block and the setup script below; the stage was the final v-else.

    <div v-else class="mx-auto w-full max-w-2xl px-5 py-12">
      <BrandLogo class="mb-8" />
      <p class="text-[12px] text-[#8f9792]">Step {{ step }} of {{ setupSteps.length }}</p>
      <h1 class="mt-1 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
        {{ setupSteps[step - 1] }}
      </h1>
      <UiProgress :value="pct" class="mt-4" />

      <UiCard class="mt-6 p-6">
        [1 · African ID]
        <div v-if="step === 1" class="flex items-center gap-4">
          <i class="fa-solid fa-shield-halved shrink-0 text-[32px] text-[#0b5d3e]" aria-hidden="true"></i>
          <div>
            <p class="text-[15px] font-medium text-[#121614]">African ID created</p>
            <p class="mt-1 text-[13px] text-[#606863]">
              @elijah · AF-NG-4827-1193 · verified on this device. Powered by DCI.
            </p>
          </div>
        </div>

        [2 · Device capability]
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

        [3 · Download AfroIntel]
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

        [4 · AI modules]
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

        [5 · Network permissions]
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

        [6 · People nearby]
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

        [7 · Pin your apps]
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
    -->
  </div>
</template>

<script setup>
import { useAfronetUserStore } from '~/stores/afronetUser'
import { useMiscellaneous } from '~/stores/miscellaneous'

// --- Setup (steps 1–7) — commented out with its template block ---
// import { apps } from '~/data/apps'
// import { device, models, modules } from '~/data/models'
// import { contacts } from '~/data/people'

import { welcomeIntro } from '~/data/welcome'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Welcome to Afronet' })

const route = useRoute()
const userStore = useAfronetUserStore()
const misc = useMiscellaneous()

// The landing page deep-links in: ?mode=create opens registration and ?mode=signin opens
// sign-in, while a bare /welcome shows the greeting.
const stageForMode = { create: 'intro', signin: 'signin' }

// welcome | signin | intro | register | devicefit | models | download | ready
const stage = ref(stageForMode[route.query.mode] ?? 'welcome')
const formError = ref('')
// const notice = ref('') // not used in new flow (no email verification step)

const signin = reactive({ identifier: '', password: '' })

// Not used in new flow (no email verification step)
// const signupEmail = ref('')
// const verifiedEmail = ref('')

const register = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  institution: '',
  country: '',
  city: '',
  // --- Old fields (not collected in new registration flow) ---
  // username: '',
  // phone: '',
  // countryId: null,
  // profileImage: '',
})

// Profile photo — not used in new registration flow
// const AVATAR_FOLDER = 'afronet/avatars'
// const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
// const AVATAR_MAX_BYTES = 5 * 1024 * 1024
// const { upload, uploading, progress } = useDirectGcsUpload()
// const avatarInput = ref(null)
// const avatarPreview = ref('')
// const avatarError = ref('')
// const setAvatarPreview = (url) => {
//   if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
//   avatarPreview.value = url
// }
// const pickAvatar = async (event) => { ... }
// const removeAvatar = () => { ... }
// onBeforeUnmount(() => setAvatarPreview(''))

const setStage = (next) => {
  formError.value = ''
  // notice.value = '' // notice not used in new flow
  stage.value = next
  // if (next === 'register') misc.getCountries()
}

// ?stage=register / email — not used in new flow (no email verification step)
// if (route.query.stage === 'register') {
//   const { data } = await useAsyncData('welcome-verified-email', () => userStore.fetchVerifiedEmail())
//   if (data.value) {
//     verifiedEmail.value = data.value
//     stage.value = 'register'
//   } else {
//     stage.value = 'email'
//     formError.value = 'Please verify your email first.'
//   }
// } else if (route.query.stage === 'email') {
//   stage.value = 'email'
// }

// onMounted(() => {
//   if (stage.value === 'register') misc.getCountries()
// })

// Username watcher — not used in new flow (no username field)
// watch(
//   () => register.username,
//   (value) => {
//     const clean = value.replace(/@/g, '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30)
//     if (clean !== value) register.username = clean
//   },
// )

// Email verification functions — not used in new flow (no email verification step)
// const cooldown = ref(0)
// let cooldownTimer = null
// const startCooldown = (seconds = 60) => { ... }
// onBeforeUnmount(() => clearInterval(cooldownTimer))
// const sendLink = async () => { ... }
// const resendLink = async () => { ... }
// const continueAfterVerify = async () => { ... }

const signIn = async () => {
  formError.value = ''
  const res = await userStore.login({ identifier: signin.identifier, password: signin.password })
  if (!res.success) {
    formError.value = res.error || 'Could not sign in'
    return
  }
  // await navigateTo(res.data?.isDciVerified ? '/chat' : '/verify-id')
  // external: a full page load, so /chat arrives cross-origin isolated and the AI can start.
  await navigateTo('/chat', { external: true })
}

/** The model picked on the choose-a-model screen; the download screen falls back without it. */
const chosenModel = ref('')

/** Leaves the setup for the chat page, which offers the same download. */
const goToChat = () => navigateTo('/chat', { external: true })

const createAccount = async () => {
  formError.value = ''
  const res = await userStore.register({
    firstName: register.firstName,
    lastName: register.lastName,
    email: register.email,
    password: register.password,
    institution: register.institution,
    country: register.country,
    city: register.city,
  })
  if (!res.success) {
    formError.value = res.error || 'Could not create your African ID'
    return
  }

  // The account exists; carry on into the guided setup, which ends in the chat.
  setStage('devicefit')
}

/* --- Setup (steps 1–7) — not needed yet ---
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

const step = ref(1)
const picked = ref(['m2', 'm3'])
const pins = ref(['ai', 'messages', 'mesh', 'files'])
const perms = reactive({ mesh: true, nearby: true, notifications: true })

const pct = computed(() => (step.value / setupSteps.length) * 100)
const reachable = contacts.filter((c) => c.presence !== 'offline')

const toggle = (list, id) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

const back = () => {
  if (step.value === 1) stage.value = 'register'
  else step.value -= 1
}

const next = () => {
  if (step.value === setupSteps.length) navigateTo('/home')
  else step.value += 1
}
*/
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
