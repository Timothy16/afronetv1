<!-- app/components/Ai/IntelBox.vue -->

<!-- The AfroIntel prompt bar: attachments menu, voice toggle and send. Emits `submit` with (value, attachment). -->
<template>
  <div class="relative w-full">
    <div
      class="flex w-full items-center gap-2 rounded-full border border-[#e4e4de] bg-[#ffffff] pl-2 pr-2 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.12)] transition-[border-color,box-shadow] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] focus-within:border-[#0b5d3e]/60"
      :class="size === 'lg' ? 'h-14' : 'h-12'"
    >
      <UiIconButton label="Add attachment or device" :tone="menu ? 'active' : 'default'" @click="menu = !menu">
        <AiIcon name="plus" :size="18" />
      </UiIconButton>

      <input
        ref="inputEl"
        v-model="value"
        :placeholder="placeholder"
        aria-label="Ask African Intelligence"
        class="min-w-0 flex-1 bg-transparent text-[#121614] placeholder:text-[#8f9792] focus:outline-none"
        :class="size === 'lg' ? 'text-[16px]' : 'text-[15px]'"
        @keydown.enter="submit"
      />

      <span
        v-if="attachment"
        class="hidden max-w-[10rem] truncate rounded-full bg-[#f7f7f4] px-2.5 py-1 text-[11px] text-[#606863] sm:block"
      >
        {{ attachment }}
      </span>

      <UiIconButton
        :label="recording ? 'Stop recording' : 'Voice input'"
        :tone="recording ? 'danger' : 'default'"
        @click="recording = !recording"
      >
        <AiIcon name="mic" :size="18" />
      </UiIconButton>

      <button
        v-if="generating"
        aria-label="Stop generating"
        title="Stop"
        class="flex h-9 w-9 items-center justify-center rounded-full bg-[#121614] text-[#ffffff] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        @click="emit('stop')"
      >
        <AiIcon name="stop" :size="16" />
      </button>
      <button
        v-else
        :disabled="!value.trim() || disabled"
        aria-label="Send to AfroIntel"
        class="flex h-9 w-9 items-center justify-center rounded-full bg-[#0b5d3e] text-[#ffffff] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] disabled:opacity-25"
        @click="submit"
      >
        <AiIcon name="send" :size="18" />
      </button>
    </div>

    <div v-if="menu" class="fixed inset-0 z-20" @click="menu = false" />
    <Transition
      enter-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="translate-y-1.5 scale-[0.98] opacity-0"
      leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-to-class="translate-y-1 scale-[0.98] opacity-0"
    >
      <div
        v-if="menu"
        class="absolute bottom-full left-0 z-30 mb-2 w-64 rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)]"
      >
        <button
          v-for="p in plusItems"
          :key="p.id"
          class="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
          @click="pick(p.id)"
        >
          <span class="w-4 text-[#606863]"><AiIcon :name="p.icon" :size="16" /></span>
          {{ p.label }}
        </button>
      </div>
    </Transition>

    <Transition
      enter-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-to-class="opacity-0"
    >
      <p
        v-if="recording"
        class="absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap text-[12px] text-[#b22c26]"
      >
        Recording · speech runs on this device
      </p>
    </Transition>
  </div>
</template>

<script setup>
const props = defineProps({
  // lg | sm
  size: { type: String, default: 'lg' },
  placeholder: { type: String, default: 'Ask African Intelligence' },
  autofocus: { type: Boolean, default: false },
  // While a reply streams, the send button becomes Stop.
  generating: { type: Boolean, default: false },
  // Model not ready yet: typing is allowed, sending is not.
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['submit', 'stop'])

const plusItems = [
  { id: 'file', label: 'Upload file', icon: 'plus' },
  { id: 'photo', label: 'Choose photo', icon: 'plus' },
  { id: 'camera', label: 'Take photo', icon: 'plus' },
  { id: 'voice', label: 'Voice recording', icon: 'mic' },
  { id: 'location', label: 'Use my location', icon: 'plus' },
  { id: 'device', label: 'Connect to Afronet device', icon: 'device' },
]

// What each menu item "attaches" in this UI-only build.
const mockAttachment = {
  file: 'clinic-report-march.pdf',
  photo: 'photo-2026-03-11.jpg',
  camera: 'photo-2026-03-11.jpg',
  voice: 'voice-note-0:14.m4a',
  location: 'Jalingo, Taraba',
  device: 'Polytechnic Node',
}

const value = ref('')
const menu = ref(false)
const attachment = ref(null)
const recording = ref(false)
const inputEl = ref(null)

const submit = () => {
  if (!value.value.trim() || props.disabled || props.generating) return
  emit('submit', value.value.trim(), attachment.value ?? undefined)
  value.value = ''
  attachment.value = null
}

const pick = (id) => {
  attachment.value = mockAttachment[id]
  menu.value = false
  inputEl.value?.focus()
}

onMounted(() => {
  if (props.autofocus) inputEl.value?.focus()
})
</script>
