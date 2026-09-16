<!-- app/components/Shell/NotificationPanel.vue -->

<template>
  <div v-if="open" class="fixed inset-0 z-40" @click="emit('close')" />
  <Transition
    enter-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
    enter-from-class="-translate-y-2 scale-[0.98] opacity-0"
    leave-active-class="transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
    leave-to-class="-translate-y-1.5 scale-[0.98] opacity-0"
  >
    <aside
      v-if="open"
      aria-label="Notifications"
      class="fixed right-3 top-14 z-50 flex max-h-[76vh] w-[min(24rem,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-[#e4e4de] bg-[#ffffff] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)]"
    >
      <header class="flex items-center justify-between border-b border-[#e4e4de] px-4 py-3">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-bell text-[14px] text-[#606863]" aria-hidden="true"></i>
          <h2 class="text-[14px] font-semibold text-[#121614]">Notifications</h2>
          <span v-if="unread > 0" class="rounded-full bg-[#eaf3ee] px-2 py-0.5 text-[11px] font-medium text-[#0b5d3e]">
            {{ unread }} new
          </span>
        </div>
        <UiButton variant="ghost" size="sm" @click="markAllRead">Mark all read</UiButton>
      </header>

      <div class="afro-scroll flex-1 overflow-y-auto p-2">
        <div v-if="notifications.length === 0" class="p-4">
          <UiStatePanel
            title="Nothing waiting"
            body="Messages, transfers and network events across every Afronet service arrive here."
          />
        </div>
        <template v-else>
          <article
            v-for="n in notifications"
            :key="n.id"
            class="group relative flex gap-3 rounded-xl p-3 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            :class="n.unread ? 'bg-[#eaf3ee]/40' : ''"
          >
            <span
              class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
              :class="n.unread ? 'bg-[#0b5d3e] text-[#ffffff]' : 'bg-[#f7f7f4] text-[#606863]'"
            >
              <i class="fa-solid text-[14px]" :class="kindIcon[n.kind]" aria-hidden="true"></i>
            </span>
            <div class="min-w-0 flex-1">
              <div class="flex items-baseline justify-between gap-3">
                <p class="truncate text-[13px] font-medium text-[#121614]">{{ n.title }}</p>
                <span class="shrink-0 text-[11px] text-[#8f9792]">{{ n.time }}</span>
              </div>
              <p class="mt-0.5 text-[12px] leading-snug text-[#606863]">{{ n.body }}</p>
              <p class="mt-1 text-[11px] text-[#8f9792]">{{ n.app }}</p>
            </div>
            <UiIconButton label="Dismiss" size="sm" class="opacity-0 group-hover:opacity-100" @click="dismiss(n.id)">
              <i class="fa-solid fa-xmark text-[12px]" aria-hidden="true"></i>
            </UiIconButton>
          </article>
        </template>
      </div>
    </aside>
  </Transition>
</template>

<script setup>
defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { notifications, markAllRead, dismiss, unread } = useAfronet()

const kindIcon = {
  message: 'fa-message',
  wallet: 'fa-wallet',
  network: 'fa-tower-broadcast',
  social: 'fa-users',
  system: 'fa-wand-magic-sparkles',
  mail: 'fa-envelope',
  security: 'fa-shield-halved',
}
</script>
