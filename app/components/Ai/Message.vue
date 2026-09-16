<!-- app/components/Ai/Message.vue -->

<template>
  <article class="msg-in flex gap-3" :class="isUser ? 'justify-end' : ''">
    <span v-if="!isUser" class="mt-0.5 shrink-0">
      <BrandMark :size="26" />
    </span>

    <div class="min-w-0" :class="isUser ? 'max-w-[75%]' : 'max-w-[calc(100%-2.5rem)]'">
      <div
        v-if="isUser"
        class="rounded-2xl rounded-br-md bg-[#f7f7f4] px-4 py-2.5 text-[14px] leading-relaxed text-[#121614]"
      >
        {{ message.body }}
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
        <p class="text-[15px] leading-[1.7] text-[#121614]">{{ message.body }}</p>

        <div v-if="message.sources?.length" class="mt-3 flex flex-wrap gap-1.5">
          <span
            v-for="s in message.sources"
            :key="s.label"
            class="inline-flex items-center gap-1.5 rounded-full border border-[#e4e4de] px-2.5 py-1 text-[11px] text-[#606863]"
          >
            <i class="fa-solid text-[10px] text-[#0b5d3e]" :class="originIcon[s.origin]" aria-hidden="true"></i>
            {{ s.label }}
          </span>
        </div>

        <div class="mt-2.5 flex items-center gap-1 text-[#8f9792]">
          <button
            v-for="a in actions"
            :key="a.label"
            :aria-label="a.label"
            :title="a.label"
            class="rounded-md p-1.5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
          >
            <i class="fa-solid text-[12px]" :class="a.icon" aria-hidden="true"></i>
          </button>
          <span class="ml-1 text-[11px]">{{ message.time }} · AfroIntel Lite, on device</span>
        </div>
      </div>
    </div>

    <img v-if="isUser" :src="me.avatar" alt="" class="mt-0.5 h-7 w-7 shrink-0 rounded-full object-cover" />
  </article>
</template>

<script setup>
import { me } from '~/data/people'

const props = defineProps({
  // { id, author: 'user' | 'afrointel', body, time, sources?, attachments?, opensApp? }
  message: { type: Object, required: true },
})

const isUser = computed(() => props.message.author === 'user')

const originIcon = {
  local: 'fa-hard-drive',
  afronet: 'fa-tower-broadcast',
  internet: 'fa-globe',
}

const actions = [
  { icon: 'fa-copy', label: 'Copy' },
  { icon: 'fa-volume-high', label: 'Read aloud' },
  { icon: 'fa-arrows-rotate', label: 'Regenerate' },
]
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

@media (prefers-reduced-motion: reduce) {
  .msg-in {
    animation: none;
  }
}
</style>
