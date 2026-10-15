<!-- app/components/Studio/BuilderChat.vue -->

<!--
  Refining a build by describing changes. The rule this panel exists to enforce comes from
  the developer guide: generated output is never applied on its own. Every request comes
  back as a proposal — what would change, and what it would cost — with Apply and Discard.
  A developer who never presses Apply never has their app altered.

  A proposal that has been applied says so, and says the app now needs testing again,
  because changing a build invalidates the test that passed.
-->
<template>
  <div class="flex h-full min-h-[560px] flex-col rounded-3xl border border-[#e4e4de] bg-[#ffffff]">
    <div class="flex items-center justify-between gap-3 border-b border-[#e4e4de] px-4 py-3">
      <p class="flex items-center gap-1.5 text-[13.5px] font-semibold text-[#121614]">
        <i class="fa-solid fa-wand-magic-sparkles text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
        AI assistant
      </p>
      <span class="text-[11.5px] text-[#8f9792]">{{ creditsLeft }} left</span>
    </div>

    <div class="afro-scroll flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
      <div
        v-for="m in messages"
        :key="m.id"
        :class="m.role === 'user' ? 'ml-8 rounded-2xl rounded-br-md bg-[#121614] px-3.5 py-2.5 text-[13.5px] text-[#ffffff]' : 'mr-4 text-[13.5px]'"
      >
        <p :class="m.role === 'ai' ? 'leading-relaxed text-[#121614]' : ''">{{ m.text }}</p>

        <div
          v-if="m.proposal"
          class="mt-2 rounded-2xl border p-3"
          :class="
            m.status === 'applied'
              ? 'border-[#0b5d3e]/30 bg-[#eaf3ee]'
              : m.status === 'discarded'
                ? 'border-[#e4e4de] opacity-60'
                : 'border-dashed border-[#121614]/25'
          "
        >
          <p class="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#606863]">
            <template v-if="m.status === 'applied'">
              <i class="fa-solid fa-circle-check text-[11px] text-[#0b5d3e]" aria-hidden="true"></i>
              <span class="text-[#0b5d3e]">Applied · build passed</span>
            </template>
            <template v-else-if="m.status === 'applying'">
              <UiSpinner />
              Building…
            </template>
            <template v-else-if="m.status === 'discarded'">Discarded</template>
            <template v-else>Suggestion · not applied</template>
          </p>

          <p class="mt-1 text-[13px] font-medium text-[#121614]">{{ m.proposal.summary }}</p>

          <p
            v-for="w in m.proposal.warnings"
            :key="w"
            class="mt-1.5 flex items-start gap-1.5 text-[12px] text-[#b07f15]"
          >
            <i class="fa-solid fa-triangle-exclamation mt-0.5 shrink-0 text-[10px]" aria-hidden="true"></i>
            {{ w }}
          </p>

          <p v-if="m.status === 'applied'" class="mt-1.5 text-[12px] text-[#606863]">
            Not tested yet — run tests before publishing.
          </p>

          <div v-if="m.status === 'suggested'" class="mt-2.5 flex gap-1.5">
            <UiButton size="sm" @click="emit('apply', m.id)">Apply</UiButton>
            <UiButton size="sm" variant="ghost" @click="emit('discard', m.id)">Discard</UiButton>
          </div>
        </div>
      </div>
    </div>

    <div class="border-t border-[#e4e4de] p-3">
      <div class="no-scrollbar mb-2 flex gap-1.5 overflow-x-auto">
        <button
          v-for="q in suggestions"
          :key="q"
          class="whitespace-nowrap rounded-full border border-[#e4e4de] px-2.5 py-1 text-[12px] font-medium text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
          @click="emit('send', q)"
        >
          {{ q }}
        </button>
      </div>

      <form class="flex items-end gap-2" @submit.prevent="submit">
        <UiTextarea
          v-model="input"
          :rows="2"
          aria-label="Describe a change"
          placeholder="Describe a change…"
          class="flex-1 resize-none"
          @keydown.enter.exact.prevent="submit"
        />
        <UiButton type="submit" :disabled="!input.trim()">
          <template #icon><i class="fa-solid fa-paper-plane text-[11px]" aria-hidden="true"></i></template>
          Send
        </UiButton>
      </form>
    </div>
  </div>
</template>

<script setup>
defineProps({
  messages: { type: Array, required: true },
  creditsLeft: { type: Number, default: 0 },
  /** Changes worth offering for this particular app. */
  suggestions: { type: Array, default: () => [] },
})

const emit = defineEmits(['send', 'apply', 'discard'])

const input = ref('')

const submit = () => {
  const text = input.value.trim()
  if (!text) return
  emit('send', text)
  input.value = ''
}
</script>
