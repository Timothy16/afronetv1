<!-- app/pages/welcome/index.vue -->

<!--
  Onboarding, outside the shell: welcome → sign in, or
  welcome → email → (verify link, /welcome/verify/:token) → register.
  The seven-step device setup after register is commented out for now.
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
          <UiButton block size="lg" @click="setStage('email')">Create African ID</UiButton>
          <UiButton block size="lg" variant="secondary" @click="setStage('signin')">Sign in</UiButton>
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

    <!-- Sign up · email -->
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

    <!-- Sign up · check inbox -->
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

          <div class="grid gap-4 sm:grid-cols-2">
            <UiField label="First name">
              <UiInput v-model="register.firstName" autocomplete="given-name" placeholder="Elijah" />
            </UiField>
            <UiField label="Last name">
              <UiInput v-model="register.lastName" autocomplete="family-name" placeholder="Adeyemi" />
            </UiField>
          </div>
          <UiField label="Username" hint="Letters, numbers, dots and underscores. This becomes your address for calls, mail and payments.">
            <!-- The @ is a fixed prefix, not part of the value: the value is always the bare handle -->
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
          <UiField label="Email" hint="Verified. This is where Afronet will reach you.">
            <div class="flex h-11 items-center gap-2 rounded-xl border border-[#e4e4de] bg-[#f7f7f4] px-3.5 text-sm text-[#121614]">
              <i class="fa-solid fa-circle-check text-[13px] text-[#0b5d3e]" aria-hidden="true"></i>
              <span class="min-w-0 flex-1 truncate">{{ verifiedEmail }}</span>
              <button type="button" class="text-[12px] text-[#606863] hover:text-[#121614]" @click="setStage('email')">
                Change
              </button>
            </div>
          </UiField>
          <div class="grid gap-4 sm:grid-cols-2">
            <UiField label="Country">
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
          <UiField label="Password" hint="At least 8 characters.">
            <UiPasswordInput v-model="register.password" autocomplete="new-password" placeholder="Create a password" />
          </UiField>
          <p v-if="formError" class="text-[13px] text-[#b22c26]" role="alert">{{ formError }}</p>
          <UiButton block type="submit" :disabled="userStore.loading || uploading">
            {{ userStore.loading ? 'Creating…' : uploading ? 'Uploading photo…' : 'Create African ID' }}
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

definePageMeta({ layout: 'blank' })
useHead({ title: 'Welcome to Afronet' })

const route = useRoute()
const userStore = useAfronetUserStore()
const misc = useMiscellaneous()

// welcome | signin | email | sent | register
const stage = ref('welcome')
const formError = ref('')
const notice = ref('')

const signin = reactive({ identifier: '', password: '' })

// Sign-up: the email typed in step one, and the one the server confirmed via the link
const signupEmail = ref('')
const verifiedEmail = ref('')

const register = reactive({
  firstName: '',
  lastName: '',
  username: '',
  phone: '',
  countryId: null, // the country id is the value; the full object is looked up on submit
  password: '',
  profileImage: '', // GCS path from useDirectGcsUpload; optional
})

// Profile photo. Previewed from a local object URL; the upload returns the GCS path we submit.
const AVATAR_FOLDER = 'afronet/avatars' // must match PROFILE_IMAGE_FOLDER on the server
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AVATAR_MAX_BYTES = 5 * 1024 * 1024

const { upload, uploading, progress } = useDirectGcsUpload()
const avatarInput = ref(null)
const avatarPreview = ref('')
const avatarError = ref('')

const setAvatarPreview = (url) => {
  if (avatarPreview.value) URL.revokeObjectURL(avatarPreview.value)
  avatarPreview.value = url
}

const pickAvatar = async (event) => {
  const file = event.target.files?.[0]
  event.target.value = '' // allow re-picking the same file
  if (!file) return

  avatarError.value = ''
  if (!AVATAR_TYPES.includes(file.type)) {
    avatarError.value = 'Use a JPG, PNG, WEBP or GIF image'
    return
  }
  if (file.size > AVATAR_MAX_BYTES) {
    avatarError.value = 'Image must be 5MB or smaller'
    return
  }

  setAvatarPreview(URL.createObjectURL(file))
  register.profileImage = ''
  try {
    register.profileImage = await upload(file, AVATAR_FOLDER)
  } catch (error) {
    avatarError.value = error?.data?.message || 'Upload failed. Please try again.'
    setAvatarPreview('')
  }
}

const removeAvatar = () => {
  setAvatarPreview('')
  register.profileImage = ''
  avatarError.value = ''
}

onBeforeUnmount(() => setAvatarPreview(''))

const setStage = (next) => {
  formError.value = ''
  notice.value = ''
  stage.value = next
  if (next === 'register') misc.getCountries()
}

// ?stage=register comes from the verify link: only open the form if this browser holds a verified email
if (route.query.stage === 'register') {
  const { data } = await useAsyncData('welcome-verified-email', () => userStore.fetchVerifiedEmail())
  if (data.value) {
    verifiedEmail.value = data.value
    stage.value = 'register'
  } else {
    stage.value = 'email'
    formError.value = 'Please verify your email first.'
  }
} else if (route.query.stage === 'email') {
  stage.value = 'email'
}

onMounted(() => {
  if (stage.value === 'register') misc.getCountries()
})

// Username: keep the bare handle. Strips any typed/pasted "@" so "@dayv" and "dayv" both become "dayv"
// (shown as @dayv via the fixed prefix), lowercases, and drops characters the API would reject.
watch(
  () => register.username,
  (value) => {
    const clean = value.replace(/@/g, '').toLowerCase().replace(/[^a-z0-9_.]/g, '').slice(0, 30)
    if (clean !== value) register.username = clean
  },
)

// Resend cooldown, mirrors the API's one-email-per-minute limit
const cooldown = ref(0)
let cooldownTimer = null
const startCooldown = (seconds = 60) => {
  clearInterval(cooldownTimer)
  cooldown.value = seconds
  cooldownTimer = setInterval(() => {
    cooldown.value -= 1
    if (cooldown.value <= 0) clearInterval(cooldownTimer)
  }, 1000)
}
onBeforeUnmount(() => clearInterval(cooldownTimer))

const sendLink = async () => {
  formError.value = ''
  const res = await userStore.sendVerification(signupEmail.value)
  if (!res.success) {
    formError.value = res.error || 'Could not send the verification email'
    return
  }
  setStage('sent')
  startCooldown()
}

const resendLink = async () => {
  formError.value = ''
  notice.value = ''
  const res = await userStore.sendVerification(signupEmail.value)
  if (!res.success) {
    formError.value = res.error || 'Could not send the verification email'
    return
  }
  notice.value = 'A new link is on its way.'
  startCooldown()
}

// For when the link was opened in another tab of this browser
const continueAfterVerify = async () => {
  formError.value = ''
  const email = await userStore.fetchVerifiedEmail()
  // The session may still hold an email verified earlier; only accept the one just sent
  if (!email || email !== signupEmail.value.trim().toLowerCase()) {
    formError.value = "We haven't seen your verification yet. Click the link in the email, then try again."
    return
  }
  verifiedEmail.value = email
  setStage('register')
}

const signIn = async () => {
  formError.value = ''
  const res = await userStore.login({ identifier: signin.identifier, password: signin.password })
  if (!res.success) {
    formError.value = res.error || 'Could not sign in'
    return
  }
  await navigateTo('/')
}

const createAccount = async () => {
  formError.value = ''
  const { countryId, ...fields } = register
  const country = misc.countries.find((c) => c.id === countryId) || null

  const res = await userStore.register({ ...fields, country })
  if (!res.success) {
    formError.value = res.error || 'Could not create your African ID'
    return
  }
  await navigateTo('/')
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
  if (step.value === setupSteps.length) navigateTo('/')
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
