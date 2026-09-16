<!-- app/components/Apps/Messages.vue -->

<!-- Mesh messaging. Rendered by /messages, and inside a workspace window with `embedded`. -->
<template>
  <div class="flex min-h-0" :class="embedded ? 'h-[560px]' : 'h-[calc(100vh-3.5rem-2.25rem)]'">
    <aside class="flex w-full max-w-xs shrink-0 flex-col border-r border-[#e4e4de] bg-[#ffffff] sm:w-80">
      <div class="border-b border-[#e4e4de] p-3">
        <div class="relative">
          <i
            class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
            aria-hidden="true"
          ></i>
          <UiInput size="sm" placeholder="Search messages" class="pl-9" />
        </div>
      </div>
      <div class="afro-scroll flex-1 overflow-y-auto">
        <button
          v-for="c in contacts"
          :key="c.id"
          class="flex w-full items-center gap-3 border-b border-[#e4e4de] px-3 py-3 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
          :class="c.id === activeId ? 'bg-[#eaf3ee]/50' : ''"
          @click="activeId = c.id"
        >
          <UiAvatar :src="c.avatar" :name="c.name" :size="38" :presence="c.presence" />
          <span class="min-w-0 flex-1">
            <span class="flex items-baseline justify-between gap-2">
              <span class="truncate text-[13px] font-medium text-[#121614]">{{ c.name }}</span>
              <span class="shrink-0 text-[11px] text-[#8f9792]">{{ c.presence === 'offline' ? 'Queued' : '08:52' }}</span>
            </span>
            <span class="mt-0.5 block truncate text-[12px] text-[#606863]">{{ presenceLabel[c.presence] }}</span>
          </span>
        </button>
      </div>
    </aside>

    <section class="flex min-w-0 flex-1 flex-col">
      <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-[#e4e4de] px-4">
        <div class="flex min-w-0 items-center gap-3">
          <UiAvatar :src="active.avatar" :name="active.name" :size="34" :presence="active.presence" />
          <div class="min-w-0">
            <p class="truncate text-[14px] font-medium text-[#121614]">{{ active.name }}</p>
            <p class="truncate text-[11px] text-[#606863]">
              {{ active.username }} · {{ presenceLabel[active.presence] }}{{ active.hops ? ` · ${active.hops} hop away` : '' }}
            </p>
          </div>
        </div>
        <UiBadge :tone="offline ? 'muted' : 'brand'">
          <i class="fa-solid fa-tower-broadcast text-[10px]" aria-hidden="true"></i>
          {{ offline ? 'Will deliver later' : 'Direct over Afronet' }}
        </UiBadge>
      </header>

      <p v-if="offline" class="border-b border-[#e4e4de] bg-[#faf3e3] px-4 py-2 text-[12px] text-[#b07f15]">
        {{ active.name }} is not reachable right now. Messages are held on your device and delivered the moment a path
        opens.
      </p>

      <div class="afro-scroll flex-1 space-y-4 overflow-y-auto p-5">
        <p v-if="bubbles.length === 0" class="pt-10 text-center text-[13px] text-[#606863]">
          No messages yet. Anything you send will travel peer-to-peer if the internet is down.
        </p>
        <div v-for="b in bubbles" :key="b.id" class="flex" :class="b.mine ? 'justify-end' : 'justify-start'">
          <div class="max-w-[78%]">
            <div v-if="b.file" class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-3">
              <div class="flex items-center gap-3">
                <i class="fa-solid fa-paperclip text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
                <div class="min-w-0">
                  <p class="truncate text-[13px] text-[#121614]">{{ b.file.name }}</p>
                  <p class="text-[11px] text-[#8f9792]">{{ b.file.size }} · transferred device to device</p>
                </div>
              </div>
              <UiProgress :value="b.file.pct" class="mt-3" />
            </div>
            <div
              v-else
              class="rounded-2xl px-3.5 py-2.5 text-[14px] leading-relaxed"
              :class="b.mine ? 'rounded-br-md bg-[#0b5d3e] text-[#ffffff]' : 'rounded-bl-md bg-[#f7f7f4] text-[#121614]'"
            >
              {{ b.body }}
            </div>
            <p class="mt-1 flex items-center gap-1 text-[10px] text-[#8f9792]" :class="b.mine ? 'justify-end' : ''">
              {{ b.time }}
              <template v-if="b.mine && b.state === 'queued'">
                <i class="fa-solid fa-clock text-[10px]" aria-hidden="true"></i>
                queued
              </template>
              <i v-if="b.mine && b.state !== 'queued'" class="fa-solid fa-check-double text-[10px]" aria-hidden="true"></i>
            </p>
          </div>
        </div>
      </div>

      <footer class="shrink-0 border-t border-[#e4e4de] p-3">
        <div class="flex items-center gap-2 rounded-full border border-[#e4e4de] bg-[#ffffff] pl-2 pr-1.5">
          <UiIconButton label="Attach file">
            <i class="fa-solid fa-paperclip text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
          <input
            v-model="draft"
            :placeholder="`Message ${active.username}`"
            aria-label="Message"
            class="h-11 min-w-0 flex-1 bg-transparent text-[14px] text-[#121614] placeholder:text-[#8f9792] focus:outline-none"
            @keydown.enter="send"
          />
          <button
            :disabled="!draft.trim()"
            aria-label="Send message"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b5d3e] text-[#ffffff] transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-25"
            @click="send"
          >
            <i class="fa-solid fa-paper-plane text-[14px]" aria-hidden="true"></i>
          </button>
        </div>
        <p class="mt-2 flex items-center gap-1.5 px-2 text-[11px] text-[#8f9792]">
          <i class="fa-solid fa-mobile-screen text-[10px]" aria-hidden="true"></i>
          End-to-end encrypted ·
          {{ mode === 'offline' ? 'stored on this device until a peer appears' : 'sending over the nearest Afronet path' }}
        </p>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { contacts, presenceLabel } from '~/data/people'

defineProps({
  embedded: { type: Boolean, default: false },
})

const { mode } = useAfronet()

// state — sent | queued | delivered
const seed = {
  p1: [
    { id: 'b1', mine: false, body: 'Are you at the polytechnic today?', time: '08:41', state: 'delivered' },
    { id: 'b2', mine: true, body: 'Yes, until 4. The node is back up.', time: '08:44', state: 'delivered' },
    {
      id: 'b3',
      mine: false,
      body: 'Good. Sending the March clinic report now — no internet on my side.',
      time: '08:45',
      state: 'delivered',
    },
    {
      id: 'b4',
      mine: false,
      body: '',
      time: '08:46',
      file: { name: 'clinic-report-march.pdf', size: '2.4 MB', pct: 100 },
    },
    {
      id: 'b5',
      mine: true,
      body: 'Received over the mesh. I will summarise it with AfroIntel and send back the Hausa version.',
      time: '08:52',
      state: 'sent',
    },
  ],
  p4: [{ id: 'c1', mine: true, body: 'Rushes are uploading to your machine.', time: 'Yesterday', state: 'queued' }],
}

const activeId = ref('p1')
const draft = ref('')
const threads = ref(JSON.parse(JSON.stringify(seed)))

const active = computed(() => contacts.find((c) => c.id === activeId.value))
const offline = computed(() => active.value.presence === 'offline')
const bubbles = computed(() => threads.value[activeId.value] ?? [])

const send = () => {
  if (!draft.value.trim()) return
  threads.value = {
    ...threads.value,
    [activeId.value]: [
      ...(threads.value[activeId.value] ?? []),
      {
        id: `n${Date.now()}`,
        mine: true,
        body: draft.value.trim(),
        time: 'now',
        state: offline.value ? 'queued' : 'sent',
      },
    ],
  }
  draft.value = ''
}
</script>
