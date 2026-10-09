<!-- app/components/Shell/TopBar.vue -->

<template>
  <header
    class="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-[#e4e4de] bg-[#ffffff]/90 px-4 backdrop-blur"
  >
    <div class="flex items-center gap-6">
      <BrandLogo />
      <nav v-if="route.path !== '/'" class="hidden items-center gap-1 md:flex">
        <NuxtLink
          v-for="l in links"
          :key="l.to"
          :to="l.to"
          class="rounded-lg px-3 py-1.5 text-[13px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="
            route.path.startsWith(l.to)
              ? 'bg-[#f7f7f4] font-medium text-[#121614]'
              : 'text-[#606863] hover:text-[#121614]'
          "
        >
          {{ l.label }}
        </NuxtLink>
      </nav>
    </div>

    <div class="flex items-center gap-1 sm:gap-2">
      <ShellConnectivityPill />
      <UiIconButton label="AfroMail" class="hidden sm:inline-flex" @click="go('/mail')">
        <i class="fa-solid fa-envelope text-[16px]" aria-hidden="true"></i>
      </UiIconButton>
      <UiIconButton label="AfroPhone" class="hidden sm:inline-flex" @click="go('/phone')">
        <i class="fa-solid fa-phone text-[16px]" aria-hidden="true"></i>
      </UiIconButton>
      <div class="relative">
        <UiIconButton label="Notifications" @click="notifOpen = !notifOpen">
          <i class="fa-solid fa-bell text-[16px]" aria-hidden="true"></i>
        </UiIconButton>
        <span
          v-if="unread > 0"
          class="pointer-events-none absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#b07f15] ring-2 ring-[#ffffff]"
        />
      </div>
      <UiIconButton label="Apps" @click="launcherOpen = true">
        <i class="fa-solid fa-grip text-[16px]" aria-hidden="true"></i>
      </UiIconButton>
      <UiIconButton label="Sign out" :disabled="signingOut" @click="signOut">
        <i class="fa-solid fa-right-from-bracket text-[16px]" aria-hidden="true"></i>
      </UiIconButton>
      <NuxtLink to="/profile" aria-label="African ID" class="ml-1">
        <UiAvatar :src="avatarUrl" :name="userStore.fullName || 'Afronet user'" :size="30" />
      </NuxtLink>
    </div>
  </header>

  <ShellNotificationPanel :open="notifOpen" @close="notifOpen = false" />
  <ShellAppsLauncher :open="launcherOpen" @close="launcherOpen = false" />
</template>

<script setup>
import { useAfronetUserStore } from '~/stores/afronetUser'

const { unread } = useAfronet()
const userStore = useAfronetUserStore()
const { getImageUrl } = useGoogleCloud()

// No image yet -> empty src, so UiAvatar falls back to initials
const avatarUrl = computed(() => (userStore.user?.profileImage ? getImageUrl(userStore.user.profileImage) : ''))

const signingOut = ref(false)
const signOut = async () => {
  signingOut.value = true
  // Devices are shared: this account's chats must not stay on it after signing out.
  const userId = userStore.user?._id
  if (userId) await useConversations().clearLocal(userId)
  const ok = await userStore.logout()
  signingOut.value = false
  if (ok) await navigateTo('/welcome')
}
const route = useRoute()

const notifOpen = ref(false)
const launcherOpen = ref(false)

const links = [
  { to: '/workspace', label: 'AI' },
  { to: '/network', label: 'Network' },
  { to: '/messages', label: 'Messages' },
  { to: '/files', label: 'Files' },
]

const go = (path) => navigateTo(path)
</script>
