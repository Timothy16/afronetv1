<!-- app/components/Ai/ModelPicker.vue -->

<!--
  Choose which AI runs on this device. The choice is per device, not per account: a laptop's
  choice synced to a phone would mean a huge download on the phone.
-->
<template>
  <div class="relative">
    <button
      type="button"
      class="flex max-w-[11rem] items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614] disabled:opacity-40"
      :disabled="generating"
      :title="generating ? 'Finish the reply first' : 'Choose the AI model'"
      @click="toggle"
    >
      <span class="truncate">{{ currentLabel }}</span>
      <AiIcon name="chevron" :size="14" />
    </button>

    <div v-if="open" class="fixed inset-0 z-30" @click="open = false" />

    <Transition
      enter-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      enter-from-class="-translate-y-1.5 scale-[0.98] opacity-0"
      leave-active-class="transition-[opacity,transform] duration-[160ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
      leave-to-class="-translate-y-1 scale-[0.98] opacity-0"
    >
      <div
        v-if="open"
        class="absolute left-0 top-full z-40 mt-1 w-[19rem] rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.04),0_24px_48px_-24px_rgba(0,0,0,0.28)]"
      >
        <p class="px-2.5 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-[#8f9792]">
          AI on this device
        </p>

        <div v-for="o in options" :key="o.spec.key" class="rounded-xl p-2.5" :class="o.current ? 'bg-[#eaf3ee]/50' : ''">
          <div class="flex items-start gap-2">
            <span class="mt-0.5 w-4 shrink-0 text-[#0b5d3e]">
              <AiIcon v-if="o.current" name="check" :size="14" />
            </span>
            <div class="min-w-0 flex-1">
              <p class="flex flex-wrap items-center gap-1.5 text-[13px] font-medium text-[#121614]">
                {{ o.spec.label }}
                <span v-if="!o.spec.verified" class="rounded-full bg-[#b07f15]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#b07f15]">
                  Not tested yet
                </span>
              </p>
              <p class="mt-0.5 text-[12px] leading-relaxed text-[#606863]">
                Recommended for {{ o.spec.recommendedFor }} ·
                <template v-if="!o.runnable">can't run on this device</template>
                <template v-else-if="o.cached">already downloaded</template>
                <template v-else>{{ formatBytes(o.downloadBytes) }} download</template>
              </p>

              <div class="mt-1.5 flex flex-wrap items-center gap-3 text-[12px]">
                <button
                  v-if="!o.current && o.runnable"
                  class="font-medium text-[#0b5d3e] hover:underline"
                  @click="choose(o)"
                >
                  {{ o.cached ? 'Use this' : `Download and use (${formatBytes(o.downloadBytes)})` }}
                </button>
                <button
                  v-if="!o.current && o.cached"
                  class="text-[#606863] hover:text-[#121614]"
                  @click="remove(o.spec.key)"
                >
                  Delete download
                </button>
                <span v-if="o.current" class="text-[12px] text-[#8f9792]">In use</span>
              </div>

              <p v-if="confirmKey === o.spec.key" class="mt-2 rounded-lg bg-[#f7f7f4] p-2 text-[11px] leading-relaxed text-[#606863]">
                This downloads about {{ formatBytes(o.downloadBytes) }} and restarts the AI. Use Wi-Fi if you can.
                <span class="mt-1.5 flex gap-3">
                  <button class="font-medium text-[#0b5d3e] hover:underline" @click="confirmSwitch(o.spec.key)">Continue</button>
                  <button class="text-[#606863] hover:text-[#121614]" @click="confirmKey = null">Cancel</button>
                </span>
              </p>
            </div>
          </div>
        </div>

        <p class="px-2.5 pb-2 pt-1 text-[11px] leading-relaxed text-[#8f9792]">
          Saved for this device only. Switching restarts the AI; your chats are kept.
        </p>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { formatBytes } from '~/lib/deviceStorage'

defineProps({
  generating: { type: Boolean, default: false },
})

const { model, modelOptions, switchModel, deleteModel } = useLLM()
const online = useOnline()

const open = ref(false)
const options = ref([])
const confirmKey = ref(null)

const currentLabel = computed(() => model.value?.label ?? 'AfroIntel')

const refreshOptions = async () => { options.value = await modelOptions() }

const toggle = async () => {
  open.value = !open.value
  confirmKey.value = null
  if (open.value) await refreshOptions()
}

const choose = (option) => {
  // Already downloaded: switch straight away. Otherwise confirm the size first.
  if (option.cached) return switchModel(option.spec.key)
  if (!online.value) return
  confirmKey.value = option.spec.key
}

const confirmSwitch = (key) => switchModel(key)

const remove = async (key) => {
  await deleteModel(key)
  await refreshOptions()
}
</script>
