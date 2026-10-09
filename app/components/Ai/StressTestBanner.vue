<!-- app/components/Ai/StressTestBanner.vue -->

<!-- Progress for the hidden on-device stability test. Temporary: remove when testing is done. -->
<template>
  <section
    v-if="state.running || state.finished"
    role="status"
    class="mx-auto w-full max-w-2xl rounded-xl border border-[#e4e4de] bg-[#f7f7f4] px-4 py-3"
  >
    <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
      <p class="text-[13px] font-medium text-[#121614]">
        {{ state.running ? `Stability test · ${state.done}/${state.total}` : `Test finished · ${state.done}/${state.total}` }}
      </p>
      <p class="text-[12px] text-[#606863]">
        {{ state.errors }} errors
        <template v-if="state.running && state.lastTps"> · last {{ state.lastTps.toFixed(1) }} tok/s</template>
        <template v-if="!state.running && state.avgTps">
          · avg {{ state.avgTps.toFixed(1) }} tok/s · first word {{ state.avgFirstWordS.toFixed(1) }}s
        </template>
      </p>
    </div>

    <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e4e4de]">
      <span
        class="block h-full rounded-full bg-[#0b5d3e] transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :style="{ width: `${state.total ? (state.done / state.total) * 100 : 0}%` }"
      />
    </div>

    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-if="state.running"
        type="button"
        class="rounded-full border border-[#e4e4de] bg-[#ffffff] px-3 py-1 text-[12px] text-[#121614] hover:bg-[#f7f7f4]"
        @click="stop"
      >
        Stop test
      </button>
      <button
        type="button"
        class="rounded-full border border-[#e4e4de] bg-[#ffffff] px-3 py-1 text-[12px] text-[#121614] hover:bg-[#f7f7f4]"
        @click="copy"
      >
        {{ copied ? 'Copied' : 'Copy log' }}
      </button>
    </div>
  </section>
</template>

<script setup>
const { state, stop, copyLog } = useStressTest()
const copied = ref(false)

const copy = async () => {
  copied.value = await copyLog()
  if (copied.value) setTimeout(() => { copied.value = false }, 2000)
}
</script>
