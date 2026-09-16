<!-- app/components/Apps/Mail.vue -->

<!-- AfroMail. Rendered by /mail, and inside a workspace window with `embedded`. -->
<template>
  <div class="flex min-h-0" :class="embedded ? 'h-[560px]' : 'h-[calc(100vh-3.5rem-2.25rem)]'">
    <aside class="hidden w-56 shrink-0 flex-col border-r border-[#e4e4de] bg-[#ffffff] p-3 lg:flex">
      <UiButton block @click="compose = true">
        <template #icon><i class="fa-solid fa-pen text-[12px]" aria-hidden="true"></i></template>
        Compose
      </UiButton>
      <nav class="mt-4 space-y-0.5">
        <button
          v-for="f in mailFolders"
          :key="f.id"
          class="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
          :class="folder === f.id ? 'bg-[#eaf3ee] font-medium text-[#0b5d3e]' : 'text-[#606863] hover:bg-[#f7f7f4]'"
          @click="folder = f.id"
        >
          {{ f.label }}
          <span v-if="f.count > 0" class="text-[11px] text-[#8f9792]">{{ f.count }}</span>
        </button>
      </nav>
      <div class="mt-auto rounded-xl bg-[#f7f7f4] p-3 text-[11px] leading-relaxed text-[#606863]">
        <span class="mb-1 flex items-center gap-1.5 font-medium text-[#121614]">
          <i class="fa-solid fa-cloud-arrow-up text-[12px]" aria-hidden="true"></i>
          1 message in outbox
        </span>
        Mail addressed to Afronet users travels over the mesh. Internet addresses wait for a gateway.
      </div>
    </aside>

    <section class="flex w-full max-w-sm shrink-0 flex-col border-r border-[#e4e4de]">
      <div class="flex h-14 items-center gap-2 border-b border-[#e4e4de] px-3">
        <div class="relative flex-1">
          <i
            class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
            aria-hidden="true"
          ></i>
          <UiInput size="sm" placeholder="Search mail" class="pl-9" />
        </div>
        <UiButton size="sm" variant="secondary" class="lg:hidden" @click="compose = true">New</UiButton>
      </div>
      <div class="afro-scroll flex-1 overflow-y-auto">
        <button
          v-for="t in mailThreads"
          :key="t.id"
          class="w-full border-b border-[#e4e4de] px-4 py-3 text-left transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
          :class="t.id === activeId ? 'bg-[#eaf3ee]/50' : ''"
          @click="activeId = t.id"
        >
          <div class="flex items-baseline justify-between gap-2">
            <span class="truncate text-[13px]" :class="t.unread ? 'font-semibold text-[#121614]' : 'text-[#606863]'">
              {{ t.from }}
            </span>
            <span class="shrink-0 text-[11px] text-[#8f9792]">{{ t.time }}</span>
          </div>
          <p class="mt-0.5 truncate text-[13px]" :class="t.unread ? 'text-[#121614]' : 'text-[#606863]'">
            {{ t.subject }}
          </p>
          <p class="mt-0.5 truncate text-[12px] text-[#8f9792]">{{ t.preview }}</p>
          <div class="mt-1.5 flex items-center gap-2">
            <UiBadge v-if="t.channel === 'afronet'" tone="brand">Afronet</UiBadge>
            <UiBadge v-else tone="muted">Internet</UiBadge>
            <span v-if="t.attachments?.length" class="flex items-center gap-1 text-[11px] text-[#8f9792]">
              <i class="fa-solid fa-paperclip text-[10px]" aria-hidden="true"></i>
              {{ t.attachments.length }}
            </span>
          </div>
        </button>
      </div>
    </section>

    <article class="afro-scroll hidden flex-1 overflow-y-auto md:block">
      <header class="flex items-start justify-between gap-4 border-b border-[#e4e4de] p-6">
        <div>
          <h1 class="text-[19px] font-semibold tracking-tight text-[#121614]">{{ active.subject }}</h1>
          <p class="mt-1.5 text-[13px] text-[#606863]">
            {{ active.from }} <span class="text-[#8f9792]">{{ active.fromHandle }}</span> · {{ active.time }}
          </p>
        </div>
        <div class="flex items-center gap-1">
          <UiIconButton label="Star">
            <i
              class="fa-star text-[14px]"
              :class="active.starred ? 'fa-solid text-[#b07f15]' : 'fa-regular'"
              aria-hidden="true"
            ></i>
          </UiIconButton>
          <UiIconButton label="Delete">
            <i class="fa-solid fa-trash-can text-[14px]" aria-hidden="true"></i>
          </UiIconButton>
        </div>
      </header>

      <div class="space-y-4 p-6 text-[14px] leading-[1.75] text-[#121614]">
        <p v-for="(p, i) in active.body" :key="i">{{ p }}</p>
        <div v-if="active.attachments?.length" class="flex flex-wrap gap-2 pt-2">
          <span
            v-for="a in active.attachments"
            :key="a"
            class="inline-flex items-center gap-2 rounded-xl border border-[#e4e4de] px-3 py-2 text-[12px] text-[#606863]"
          >
            <i class="fa-solid fa-paperclip text-[12px]" aria-hidden="true"></i>
            {{ a }}
          </span>
        </div>
      </div>

      <div class="mx-6 mb-6 rounded-2xl border border-[#e4e4de] bg-[#f7f7f4] p-4">
        <div class="flex items-center gap-2">
          <i class="fa-solid fa-wand-magic-sparkles text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
          <p class="text-[13px] font-medium text-[#121614]">AfroIntel in mail</p>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <button
            v-for="a in aiActions"
            :key="a"
            class="rounded-full border border-[#e4e4de] bg-[#ffffff] px-3 py-1.5 text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
            @click="aiOpen = true"
          >
            {{ a }}
          </button>
        </div>
        <p v-if="aiOpen" class="mt-4 border-t border-[#e4e4de] pt-3 text-[13px] leading-relaxed text-[#121614]">
          Amina sent the second round of Taraba readings. Two rural sites reported via mesh, so their timestamps lag
          but the data is intact. She needs the sample sizes confirmed before Friday.
        </p>
      </div>

      <div class="flex items-center gap-2 border-t border-[#e4e4de] px-6 py-4">
        <UiButton variant="secondary" size="sm">Reply</UiButton>
        <UiButton variant="ghost" size="sm">Forward</UiButton>
        <span class="ml-auto flex items-center gap-2 text-[11px] text-[#8f9792]">
          AfroPhone call
          <UiComingSoon />
        </span>
      </div>
    </article>

    <UiModal
      :open="compose"
      title="New message"
      description="Sends over Afronet when the recipient is nearby, otherwise queues for a gateway."
      width="max-w-2xl"
      @close="compose = false"
    >
      <div class="space-y-3">
        <UiInput placeholder="To — @username or email" />
        <div class="grid grid-cols-2 gap-3">
          <UiInput placeholder="Cc" />
          <UiInput placeholder="Bcc" />
        </div>
        <UiInput placeholder="Subject" />
        <UiTextarea v-model="body" :rows="8" placeholder="Write your message" />
        <div class="flex flex-wrap items-center gap-2">
          <UiButton variant="secondary" size="sm" @click="body = aiDraft">
            <template #icon><i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i></template>
            Draft with AfroIntel
          </UiButton>
          <UiButton variant="ghost" size="sm">
            <template #icon><i class="fa-solid fa-paperclip text-[12px]" aria-hidden="true"></i></template>
            Attach
          </UiButton>
          <UiButton variant="ghost" size="sm">Voice message</UiButton>
          <UiButton class="ml-auto" size="sm" @click="compose = false">Send</UiButton>
        </div>
      </div>
    </UiModal>
  </div>
</template>

<script setup>
import { mailFolders, mailThreads } from '~/data/mail'

defineProps({
  embedded: { type: Boolean, default: false },
})

const folder = ref('inbox')
const activeId = ref(mailThreads[0].id)
const compose = ref(false)
const aiOpen = ref(false)
const body = ref('')

const active = computed(() => mailThreads.find((t) => t.id === activeId.value))

const aiActions = ['Summarise this email', 'Reply professionally', 'Translate to Hausa', 'Extract the dates']

const aiDraft =
  'Dear Amina,\n\nThank you for the second round of readings. I have confirmed the sample sizes for all six sites and noted the timestamp offset on the two mesh-reported locations.\n\nI will send the consolidated set before Friday.\n\nKind regards,\nElijah'
</script>
