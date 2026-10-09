<!-- app/components/Shell/MobileNav.vue -->

<template>
  <nav
    aria-label="Primary"
    class="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-[#e4e4de] bg-[#ffffff]/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
  >
    <NuxtLink
      v-for="i in items"
      :key="i.to"
      :to="i.to"
      class="flex w-16 flex-col items-center gap-1 text-[10px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="isActive(i.to) ? 'text-[#0b5d3e]' : 'text-[#8f9792]'"
    >
      <i class="fa-solid text-[18px]" :class="i.icon" aria-hidden="true"></i>
      {{ i.label }}
    </NuxtLink>
    <button
      class="flex w-16 flex-col items-center gap-1 text-[10px] text-[#8f9792] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
      @click="launcher = true"
    >
      <i class="fa-solid fa-grip text-[18px]" aria-hidden="true"></i>
      Apps
    </button>
    <NuxtLink
      to="/profile"
      class="flex w-16 flex-col items-center gap-1 text-[10px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      :class="route.path.startsWith('/profile') ? 'text-[#0b5d3e]' : 'text-[#8f9792]'"
    >
      <i class="fa-solid fa-user text-[18px]" aria-hidden="true"></i>
      Profile
    </NuxtLink>
  </nav>
  <ShellAppsLauncher :open="launcher" @close="launcher = false" />
</template>

<script setup>
const route = useRoute()
const launcher = ref(false)

const items = [
  { to: '/home', label: 'Home', icon: 'fa-house' },
  { to: '/workspace', label: 'AI', icon: 'fa-wand-magic-sparkles' },
  { to: '/social', label: 'Social', icon: 'fa-users' },
]

const isActive = (to) => (to === '/' ? route.path === '/' : route.path.startsWith(to))
</script>
