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
        @select="selectConversation"
        @new="startNewChat"
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
          @select="selectConversation"
          @new="startNewChat"
          @close="drawer = false"
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
          <!-- Tap 5× to start the hidden stability test. -->
          <button type="button" aria-label="Afronet" class="shrink-0" @click="registerTap">
            <BrandMark :size="26" />
          </button>
          <span class="truncate text-[15px] font-semibold tracking-[-0.02em] text-[#121614]">AfroIntel</span>
          <AiModelPicker :generating="generating" class="hidden sm:block" />
          <span
            v-if="!online"
            class="inline-flex items-center gap-1 rounded-full bg-[#f7f7f4] px-2 py-0.5 text-[11px] text-[#606863]"
          >
            <AiIcon name="offline" :size="12" /> Offline
          </span>
        </div>

        <div class="flex items-center gap-1">
          <button
            v-if="messages.length"
            type="button"
            class="rounded-lg px-2.5 py-1.5 text-[13px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] disabled:opacity-40"
            :disabled="generating"
            @click="startNewChat"
          >
            New chat
          </button>
          <AiAboutPanel />
          <a
            href="/"
            aria-label="Back to Afronet"
            class="rounded-lg p-2 text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
          >
            <AiIcon name="back" :size="18" />
          </a>
        </div>
      </header>

      <div ref="scrollEl" class="afro-scroll min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div class="mx-auto flex w-full max-w-2xl flex-col gap-5">
          <AiUpdatePrompt :generating="generating" />
          <AiCrashNotice />
          <AiStressTestBanner />

          <!-- Download / starting / error states; hidden once the model is ready. -->
          <AiSetupCard v-if="status !== 'ready'" />

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

          <AiMessage v-for="m in messages" :key="m.id" :message="m" @retry="retry" />
        </div>
      </div>

      <div class="shrink-0 border-t border-[#e4e4de] bg-[#ffffff] px-4 py-4">
        <div class="mx-auto w-full max-w-2xl">
          <AiIntelBox
            size="sm"
            placeholder="Ask African Intelligence"
            :generating="generating"
            :disabled="status !== 'ready'"
            @submit="send"
            @stop="stop"
          />
          <p class="mt-2 text-center text-[11px] text-[#8f9792]">{{ footer }}</p>
          <div class="mt-1 flex justify-center sm:hidden">
            <AiModelPicker :generating="generating" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
const { refresh } = useConversations()
const { start: startSync, sync } = useChatSync()
const { registerTap, takePending, start } = useStressTest()
const online = useOnline()

const scrollEl = ref(null)
const drawer = ref(false)

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

onMounted(async () => {
  await importLegacyChat()
  await refresh(true)
  startSync()
  sync() // catch up with the account in the background; chatting never waits for it

  // ?stresstest=30, or a run requested before a thread-count reload.
  const requested = Number(new URLSearchParams(location.search).get('stresstest')) || takePending()
  if (!requested) return
  const stopWatching = watch(status, (value) => {
    if (value !== 'ready') return
    stopWatching()
    start(requested)
  }, { immediate: true })
})
</script>
