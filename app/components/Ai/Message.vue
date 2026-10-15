<!-- app/components/Ai/Message.vue -->

<!--
  One chat turn. Shape matches useChat's UiMessage (and the stored message model):
  { id, role: 'user' | 'assistant', content, status, model?, stats?, error? }
  Optional extras used by the workspace demo: sources, attachments, opensApp.
-->
<template>
  <article class="msg-in flex gap-3" :class="isUser ? 'justify-end' : ''">
    <span v-if="!isUser" class="mt-0.5 shrink-0">
      <BrandMark :size="26" />
    </span>

    <div class="min-w-0" :class="isUser ? 'max-w-[75%]' : 'max-w-[calc(100%-2.5rem)]'">
      <div
        v-if="isUser"
        class="whitespace-pre-wrap rounded-2xl rounded-br-md bg-[#f7f7f4] px-4 py-2.5 text-[14px] leading-relaxed text-[#121614]"
      >
        {{ message.content }}
        <div v-if="message.attachments?.length" class="mt-2 flex flex-wrap gap-1.5">
          <span
            v-for="a in message.attachments"
            :key="a.name"
            class="rounded-full border border-[#e4e4de] bg-[#ffffff] px-2.5 py-1 text-[11px] text-[#606863]"
          >
            {{ a.name }}
          </span>
        </div>
      </div>

      <div v-else>
        <!-- Replies are Markdown; renderMarkdown escapes everything before formatting. -->
        <div v-if="message.content" class="reply text-[15px] leading-[1.7] text-[#121614]" v-html="html" />
        <span v-else-if="message.status === 'streaming'" class="caret inline-block h-4 w-[2px] bg-[#0b5d3e] align-middle" />

        <p v-if="message.status === 'error'" class="mt-2 text-[13px] text-[#b22c26]">
          {{ message.error || 'Something went wrong.' }}
        </p>
        <p v-else-if="message.status === 'stopped'" class="mt-2 text-[12px] text-[#8f9792]">Stopped</p>

        <div v-if="message.sources?.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="s in message.sources"
            :key="s.label"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4de] px-2.5 py-1 text-[11px] text-[#606863]"
          >
            {{ s.label }}
          </span>
        </div>

        <div v-if="message.status !== 'streaming'" class="mt-2.5 flex items-center gap-1 text-[#8f9792]">
          <button
            :aria-label="copied ? 'Copied' : 'Copy'"
            :title="copied ? 'Copied' : 'Copy'"
            class="rounded-md p-1.5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
            @click="copy"
          >
            <AiIcon :name="copied ? 'check' : 'copy'" :size="14" />
          </button>
          <button
            v-if="canRetry"
            aria-label="Try again"
            title="Try again"
            class="rounded-md p-1.5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
            @click="emit('retry')"
          >
            <AiIcon name="refresh" :size="14" />
          </button>
          <button
            v-if="canCorrect && !correcting"
            aria-label="Correct this answer"
            title="Correct this answer"
            class="rounded-md p-1.5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
            @click="startCorrecting"
          >
            <AiIcon name="edit" :size="14" />
          </button>
          <span class="ml-1 text-[11px]">{{ footer }}</span>
          <button
            v-if="message.source === 'brain' && isLast"
            class="ml-1 text-[11px] text-[#0b5d3e] hover:underline disabled:opacity-40"
            :disabled="generating"
            @click="emit('ask-model')"
          >
            Not what I asked
          </button>
        </div>

        <!-- Teaching the brain: saved for this account, used the next time this is asked. -->
        <form v-if="correcting" class="mt-3 rounded-2xl border border-[#e4e4de] p-3" @submit.prevent="saveCorrection">
          <label class="block text-[12px] font-medium text-[#606863]" :for="`fix-${message.id}`">What is the right answer?</label>
          <textarea
            :id="`fix-${message.id}`"
            v-model="answer"
            rows="3"
            class="mt-1.5 w-full resize-y rounded-xl border border-[#e4e4de] px-3 py-2 text-[14px] text-[#121614] outline-none focus:border-[#0b5d3e]"
          />
          <div class="mt-2 flex items-center justify-end gap-2">
            <button type="button" class="rounded-lg px-3 py-1.5 text-[12px] text-[#606863] hover:bg-[#f7f7f4]" @click="correcting = false">
              Cancel
            </button>
            <button
              type="submit"
              class="rounded-lg bg-[#0b5d3e] px-3 py-1.5 text-[12px] font-medium text-[#ffffff] hover:opacity-90 disabled:opacity-40"
              :disabled="!answer.trim() || saving"
            >
              Save to my brain
            </button>
          </div>
          <p v-if="saveError" class="mt-2 text-[12px] text-[#b22c26]">{{ saveError }}</p>
        </form>
        <p v-else-if="savedNote" class="mt-2 text-[12px] text-[#0b5d3e]">{{ savedNote }}</p>
      </div>
    </div>

    <UiAvatar v-if="isUser" :name="userName" :size="28" class="mt-0.5" />
  </article>
</template>

<script setup>
import { renderMarkdown } from '~/lib/markdown'
import { useAfronetUserStore } from '~/stores/afronetUser'

const props = defineProps({
  message: { type: Object, required: true },
  // The question this reply answers; without it the reply can't be corrected.
  question: { type: String, default: '' },
  isLast: { type: Boolean, default: false },
  generating: { type: Boolean, default: false },
})

const emit = defineEmits(['retry', 'ask-model'])

const userStore = useAfronetUserStore()

const isUser = computed(() => props.message.role === 'user')
const userName = computed(() => userStore.fullName || 'You')
const html = computed(() => renderMarkdown(props.message.content || ''))
const canRetry = computed(() => props.message.status === 'error' || props.message.status === 'stopped')

// "AfroIntel · on this device · 24.5 tok/s", or "From your brain · saved 12 Oct 2026"
const footer = computed(() => {
  if (props.message.source === 'brain') return props.message.model || 'From your brain'
  const parts = [props.message.model || 'AfroIntel', 'on this device']
  const tps = props.message.stats?.tokensPerSecond
  if (tps) parts.push(`${tps.toFixed(1)} tok/s`)
  return parts.join(' · ')
})

const canCorrect = computed(() =>
  Boolean(props.question) && (props.message.status === 'done' || props.message.status === 'stopped'))

const correcting = ref(false)
const answer = ref('')
const saving = ref(false)
const saveError = ref('')
const savedNote = ref('')

const startCorrecting = () => {
  answer.value = ''
  saveError.value = ''
  correcting.value = true
}

const saveCorrection = async () => {
  saving.value = true
  saveError.value = ''
  try {
    const entry = await useBrain().saveCorrection(props.question, answer.value)
    if (!entry) throw new Error('Sign in to save corrections.')
    correcting.value = false
    savedNote.value = `Saved to your brain under ${entry.category}. Ask this again and you'll get this answer.`
  }
  catch (err) {
    saveError.value = err instanceof Error ? err.message : 'Could not save. Try again.'
  }
  finally {
    saving.value = false
  }
}

const copied = ref(false)
const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  }
  catch { /* clipboard blocked: the text is selectable anyway */ }
}
</script>

<style scoped>
.msg-in {
  animation: msg-in 0.22s cubic-bezier(0.23, 1, 0.32, 1) both;
}

@keyframes msg-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.caret {
  animation: caret 1s steps(2) infinite;
}

@keyframes caret {
  0%,
  50% {
    opacity: 1;
  }
  51%,
  100% {
    opacity: 0;
  }
}

/* Markdown coming out of the model. */
.reply :deep(p) {
  margin: 0 0 0.75rem;
}

.reply :deep(p:last-child) {
  margin-bottom: 0;
}

.reply :deep(ul),
.reply :deep(ol) {
  margin: 0 0 0.75rem;
  padding-left: 1.25rem;
  list-style: revert;
}

.reply :deep(li) {
  margin: 0.15rem 0;
}

.reply :deep(h3),
.reply :deep(h4),
.reply :deep(h5),
.reply :deep(h6) {
  margin: 0 0 0.5rem;
  font-size: 15px;
  font-weight: 600;
}

.reply :deep(code) {
  border-radius: 4px;
  background: #f7f7f4;
  padding: 0.1rem 0.3rem;
  font-size: 13px;
}

.reply :deep(pre) {
  margin: 0 0 0.75rem;
  overflow-x: auto;
  border-radius: 12px;
  background: #f7f7f4;
  padding: 0.75rem;
}

.reply :deep(pre code) {
  background: none;
  padding: 0;
}

@media (prefers-reduced-motion: reduce) {
  .msg-in,
  .caret {
    animation: none;
  }
}
</style>
