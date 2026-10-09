<!-- app/pages/workspace/index.vue -->

<!--
  The AfroIntel workspace: conversation on the left, app windows on the right.
  A reply that names an app opens it as a window; split view shows the last two.
-->
<template>
  <div class="flex h-[calc(100vh-3.5rem-2.25rem)] min-h-0 w-full">
    <!-- Workspace navigation -->
    <aside
      class="hidden shrink-0 flex-col border-r border-[#e4e4de] bg-[#ffffff] transition-[width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] md:flex"
      :class="navOpen ? 'w-60' : 'w-14'"
    >
      <div class="flex items-center justify-between p-3">
        <UiButton v-if="navOpen" size="sm" variant="secondary" @click="messages = []">
          <template #icon><i class="fa-solid fa-plus text-[12px]" aria-hidden="true"></i></template>
          New conversation
        </UiButton>
        <button
          :aria-label="navOpen ? 'Collapse navigation' : 'Expand navigation'"
          class="rounded-lg p-2 text-[#8f9792] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
          @click="navOpen = !navOpen"
        >
          <i class="fa-solid fa-bars-staggered text-[14px]" aria-hidden="true"></i>
        </button>
      </div>

      <div v-if="navOpen" class="afro-scroll flex-1 overflow-y-auto px-2 pb-3">
        <p class="px-2 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-wide text-[#8f9792]">Conversations</p>
        <button
          v-for="c in conversations"
          :key="c.id"
          class="block w-full truncate rounded-lg px-2 py-2 text-left text-[13px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
        >
          {{ c.title }}
        </button>

        <a
          href="/chat"
          class="mt-3 flex w-full items-center gap-2.5 rounded-lg border border-[#e4e4de] px-2 py-2 text-left text-[13px] text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
        >
          <i class="fa-solid fa-microchip w-4 text-center text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
          On-device AfroIntel
        </a>

        <div class="mt-4 space-y-0.5 border-t border-[#e4e4de] pt-3">
          <button
            v-for="l in navLinks"
            :key="l.label"
            class="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-[13px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
            @click="go(l.to)"
          >
            <i class="fa-solid w-4 text-center text-[14px]" :class="l.icon" aria-hidden="true"></i>
            {{ l.label }}
          </button>
        </div>
      </div>
    </aside>

    <!-- Conversation + windows -->
    <div class="flex min-w-0 flex-1 flex-col lg:flex-row">
      <section
        class="flex min-h-0 min-w-0 flex-col"
        :class="shown.length > 0 ? 'lg:w-[46%] lg:border-r lg:border-[#e4e4de]' : 'flex-1'"
      >
        <div ref="scrollEl" class="afro-scroll flex-1 overflow-y-auto px-5 py-6">
          <div class="mx-auto w-full max-w-2xl space-y-7">
            <div v-if="messages.length === 0 && !thinking" class="pt-10 text-center">
              <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
                What do you want to work on?
              </h1>
              <p class="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-[#606863]">
                AfroIntel answers on your device first, reaches nearby nodes second, and the internet only if you
                allow it.
              </p>
              <div class="mt-6 flex flex-wrap justify-center gap-2">
                <button
                  v-for="p in suggestedPrompts"
                  :key="p"
                  class="rounded-full border border-[#e4e4de] px-3 py-1.5 text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
                  @click="send(p)"
                >
                  {{ p }}
                </button>
              </div>
            </div>

            <div v-for="m in messages" :key="m.id" class="space-y-3">
              <AiMessage :message="m" />
              <button
                v-if="m.opensApp"
                class="ml-9 inline-flex items-center gap-2 rounded-xl border border-[#e4e4de] px-3 py-2 text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
                @click="focusApp(m.opensApp)"
              >
                <i class="fa-solid fa-message text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
                Opened {{ findApp(m.opensApp)?.name }} in this workspace
              </button>
            </div>

            <AiThinking v-if="thinking" />
          </div>
        </div>

        <div class="shrink-0 border-t border-[#e4e4de] bg-[#ffffff] px-5 py-4">
          <div class="mx-auto w-full max-w-2xl">
            <AiIntelBox size="sm" placeholder="Ask African Intelligence" @submit="send" />
            <div v-if="minimized.length > 0" class="mt-3 flex flex-wrap items-center gap-2">
              <span class="text-[11px] text-[#8f9792]">Minimised</span>
              <button
                v-for="w in minimized"
                :key="w.appId"
                class="rounded-full border border-[#e4e4de] px-2.5 py-1 text-[11px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
                @click="focusApp(w.appId)"
              >
                {{ findApp(w.appId)?.name }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <TransitionGroup
        v-if="shown.length > 0"
        tag="section"
        class="flex min-h-0 flex-1 gap-3 p-3"
        enter-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        enter-from-class="translate-y-2.5 scale-[0.99] opacity-0"
        leave-active-class="transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        leave-to-class="translate-y-2 scale-[0.99] opacity-0"
      >
        <div v-for="w in shown" :key="w.appId" class="min-h-0 min-w-0 flex-1">
          <WorkspaceAppWindow :app-id="w.appId" @ask="(name) => send(`What can I do in ${name}?`)" />
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup>
import { findApp } from '~/data/apps'
import { conversations, defaultReply, scriptedReplies, suggestedPrompts } from '~/data/conversations'

useHead({ title: 'AfroIntel — Afronet' })

const { windows, activeWindow, openApp, focusApp, splitView } = useAfronet()

const messages = ref([])
const thinking = ref(false)
const navOpen = ref(true)
const scrollEl = ref(null)
const timers = new Set()

const navLinks = [
  { label: 'Saved', icon: 'fa-bookmark', to: '/files' },
  { label: 'Files', icon: 'fa-folder', to: '/files' },
  { label: 'AI modules', icon: 'fa-cubes', to: '/modules' },
  { label: 'All apps', icon: 'fa-grip', to: '/settings' },
]

const visible = computed(() => windows.value.filter((w) => !w.minimized))
const shown = computed(() =>
  splitView.value ? visible.value.slice(-2) : visible.value.filter((w) => w.appId === activeWindow.value).slice(-1),
)
const minimized = computed(() => windows.value.filter((w) => w.minimized))

const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

const send = (value, attachment) => {
  messages.value = [
    ...messages.value,
    {
      id: `u${Date.now()}`,
      role: 'user',
      content: value,
      status: 'done',
      time: now(),
      attachments: attachment ? [{ name: attachment, kind: 'file' }] : undefined,
    },
  ]
  thinking.value = true

  const t = window.setTimeout(() => {
    timers.delete(t)
    const script = scriptedReplies.find((s) => s.match.test(value))
    thinking.value = false
    messages.value = [
      ...messages.value,
      {
        id: `a${Date.now()}`,
        role: 'assistant',
        content: script?.body ?? defaultReply,
        status: 'done',
        model: 'AfroIntel (demo)',
        time: now(),
        sources: script?.sources,
        opensApp: script?.opensApp,
      },
    ]
    if (script?.opensApp) openApp(script.opensApp)
  }, 900)
  timers.add(t)
}

const go = (path) => navigateTo(path)

// Keep the newest message in view.
watch([() => messages.value.length, thinking], async () => {
  await nextTick()
  scrollEl.value?.scrollTo({ top: scrollEl.value.scrollHeight, behavior: 'smooth' })
})

// A prompt typed on Home arrives in history state (see pages/index.vue).
onMounted(() => {
  const prompt = window.history.state?.prompt
  if (prompt) send(prompt)
})

onBeforeUnmount(() => {
  timers.forEach((t) => window.clearTimeout(t))
})
</script>
