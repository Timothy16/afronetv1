<!-- app/components/Ai/ChatScreen.vue -->

<!--
  The whole chat surface, used by /chat (a new chat) and /chat/:id (an existing one).
  The model runs in this browser; conversations are saved on this device.
-->
<template>
  <div class="flex h-[100dvh] w-full overflow-hidden bg-[#ffffff]">
    <!-- Conversations: a column on desktop, a drawer on phones -->
    <aside class="hidden w-64 shrink-0 border-r border-[#e4e4de] md:block">
      <AiConversationList
        :active-id="activeId"
        :generating="generating"
        :signing-out="signingOut"
        @select="selectConversation"
        @new="startNewChat"
        @signout="signOut"
      />
    </aside>

    <Transition
      enter-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-to-class="opacity-0"
    >
      <div v-if="drawer" class="fixed inset-0 z-40 bg-[#121614]/30 md:hidden" @click="drawer = false" />
    </Transition>
    <Transition
      enter-active-class="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="-translate-x-full"
      leave-active-class="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-to-class="-translate-x-full"
    >
      <aside v-if="drawer" class="fixed inset-y-0 left-0 z-50 w-72 border-r border-[#e4e4de] shadow-xl md:hidden">
        <AiConversationList
          :active-id="activeId"
          :generating="generating"
          :signing-out="signingOut"
          @select="selectConversation"
          @new="startNewChat"
          @close="drawer = false"
          @signout="signOut"
        />
      </aside>
    </Transition>

    <div class="flex min-w-0 flex-1 flex-col">
      <header class="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e4e4de] bg-[#ffffff]/90 px-4 backdrop-blur">
        <div class="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="Conversations"
            class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] md:hidden"
            @click="drawer = true"
          >
            <AiIcon name="menu" :size="18" />
          </button>
          <span class="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#121614] sm:hidden">Afronet</span>
          <AiModelPicker :generating="generating" class="hidden sm:block" />
          <span
            v-if="!online"
            class="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#f7f7f4] px-1.5 py-0.5 text-[11px] text-[#606863] sm:px-2"
            title="No connection — the AI still answers on this device"
          >
            <AiIcon name="offline" :size="12" />
            <span class="hidden sm:inline">Offline</span>
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            v-if="messages.length"
            type="button"
            aria-label="New chat"
            title="New chat"
            class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] disabled:opacity-40 sm:px-2.5 sm:py-1.5 sm:text-[13px]"
            :disabled="generating"
            @click="startNewChat"
          >
            <AiIcon name="plus" :size="18" class="sm:hidden" />
            <span class="hidden sm:inline">New chat</span>
          </button>
          <AiBrainPanel />
          <AiAboutPanel />
          <button
            type="button"
            :aria-label="signingOut ? 'Signing out' : 'Sign out'"
            :title="signingOut ? 'Signing out…' : 'Sign out'"
            class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] disabled:opacity-40"
            :disabled="signingOut"
            @click="signOut"
          >
            <AiIcon name="signout" :size="18" />
          </button>
        </div>
      </header>

      <div ref="scrollEl" class="afro-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div class="mx-auto flex w-full max-w-2xl flex-col gap-5">
          <AiUpdatePrompt :generating="generating" />
          <AiCrashNotice />

          <!-- Download / starting / error states; hidden once the model is ready. -->
          <div v-if="status !== 'ready'" ref="setupEl" :class="nudge ? 'nudge' : ''">
            <AiSetupCard />
          </div>

          <div v-else-if="messages.length === 0 && !loadingConversation" class="pt-10 text-center">
            <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
              Ask African Intelligence
            </h1>
            <p class="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[#606863]">
              AfroIntel runs on this device. Your questions and answers stay here, with or without
              the internet.
            </p>
            <div class="mt-6 flex flex-wrap justify-center gap-2">
              <button
                v-for="p in suggestions"
                :key="p"
                class="rounded-full border border-[#e4e4de] px-3 py-1.5 text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
                @click="send(p)"
              >
                {{ p }}
              </button>
            </div>
          </div>

          <AiMessage
            v-for="(m, i) in messages"
            :key="m.id"
            :message="m"
            :question="m.role === 'assistant' && messages[i - 1]?.role === 'user' ? messages[i - 1].content : ''"
            :is-last="i === messages.length - 1"
            :generating="generating"
            @retry="retry"
            @ask-model="send(messages[i - 1].content, { skipBrain: true })"
          />
        </div>
      </div>

      <div class="shrink-0 border-t border-[#e4e4de] bg-[#ffffff] px-4 py-4">
        <div class="mx-auto w-full max-w-2xl">
          <AiIntelBox
            size="sm"
            :placeholder="status === 'ready' ? 'Ask African Intelligence' : 'Download an AI to start chatting'"
            :generating="generating"
            :disabled="status !== 'ready'"
            @submit="(text) => send(text)"
            @stop="stop"
            @blocked="promptDownload"
          />
          <p class="mt-2 text-center text-[11px] text-[#8f9792]">{{ footer }}</p>
          <div class="mt-1 flex justify-center sm:hidden">
            <AiModelPicker :generating="generating" placement="up" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAfronetUserStore } from '~/stores/afronetUser'

const props = defineProps({
  // From /chat/:id. Empty means a new chat.
  conversationId: { type: String, default: '' },
})

const router = useRouter()
const { status, info, caps, interrupted, modelLabel, load } = useLLM()
const {
  messages, activeId, generating, loadingConversation,
  send, retry, stop, newChat, openConversation, importLegacyChat,
} = useChat()
const { refresh, clearLocal } = useConversations()
const userStore = useAfronetUserStore()
const { start: startSync, sync } = useChatSync()
const online = useOnline()
const { endSession } = useCrashLog()

const scrollEl = ref(null)
const setupEl = ref(null)
const drawer = ref(false)
/** Briefly draws the eye to the setup card when someone taps the input with no AI installed. */
const nudge = ref(false)
let nudgeTimer
const signingOut = ref(false)

// The chat has no app shell around it, so this is the only way out. Local chats go first:
// devices are shared, and the next person signing in must not see them.
const signOut = async () => {
  if (signingOut.value) return
  signingOut.value = true
  const userId = userStore.user?._id
  // One last attempt to hand anything unsent to the account before the device's copy goes.
  if (navigator.onLine) await sync().catch(() => {})
  if (userId) await clearLocal(userId)
  const ok = await userStore.logout()
  signingOut.value = false
  if (ok) await navigateTo('/')
}

const suggestions = [
  'What are some of Africa\'s major ancient civilizations?',
  'Give me one tip for saving money.',
  'Explain photosynthesis simply.',
]

const footer = computed(() => {
  if (status.value !== 'ready') return 'AfroIntel runs on your device. Nothing you type is sent to a server.'
  const threads = caps.value?.threads ?? 1
  const path = info.value?.device === 'webgpu' ? 'graphics chip' : `${threads} core${threads > 1 ? 's' : ''}`
  return `${modelLabel()} · ${path} · answers generated on this device`
})

// Tapping the message box before an AI exists: show them where to get one.
const promptDownload = async () => {
  drawer.value = false
  await nextTick()
  setupEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  nudge.value = false
  await nextTick()
  nudge.value = true
  clearTimeout(nudgeTimer)
  nudgeTimer = setTimeout(() => { nudge.value = false }, 1400)
}

onBeforeUnmount(() => clearTimeout(nudgeTimer))

const startNewChat = () => {
  drawer.value = false
  newChat()
  if (router.currentRoute.value.path !== '/chat') router.replace('/chat')
}

const selectConversation = (id) => {
  drawer.value = false
  if (!id) {
    // The open conversation was deleted.
    if (!messages.value.length || activeId.value === null) return
    startNewChat()
    return
  }
  router.push(`/chat/${id}`)
}

// Already downloaded: start it without asking. A download always needs a tap, and after an
// interrupted setup we wait too, rather than running into the same crash.
watch([status, interrupted], ([value, wasInterrupted]) => {
  if (value === 'cached' && !wasInterrupted) load()
}, { immediate: true })

// Opening /chat/:id loads that conversation; /chat starts an empty one.
watch(() => props.conversationId, (id) => {
  if (id) openConversation(id)
  else if (activeId.value) newChat()
}, { immediate: true })

// The first question creates the conversation; move to its address without reloading the page,
// so the streaming reply is not interrupted.
watch(activeId, (id) => {
  if (id && router.currentRoute.value.path === '/chat') {
    window.history.replaceState(window.history.state, '', `/chat/${id}`)
  }
})

// Keep the newest message in view while a reply streams in.
watch(
  () => [messages.value.length, messages.value.at(-1)?.content],
  async () => {
    await nextTick()
    scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
  },
)

// Leaving the chat from inside the app (sign-out, or back to the site) is a clean exit, not the
// device killing the page — without this, signing out produced a false "restarted" warning.
onBeforeUnmount(() => endSession())

onMounted(async () => {
  await importLegacyChat()
  await refresh(true)
  startSync()
  sync() // catch up with the account in the background; chatting never waits for it
})
</script>

<style scoped>
/* A short pulse on the setup card, so a tap on the disabled message box lands somewhere. */
.nudge {
  animation: nudge 1.4s cubic-bezier(0.23, 1, 0.32, 1);
}

@keyframes nudge {
  0%,
  100% {
    transform: scale(1);
  }
  12% {
    transform: scale(1.02);
  }
}

@media (prefers-reduced-motion: reduce) {
  .nudge {
    animation: none;
    outline: 2px solid #0b5d3e;
    outline-offset: 4px;
    border-radius: 18px;
  }
}
</style>
