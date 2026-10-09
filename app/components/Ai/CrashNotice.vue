<!-- app/components/Ai/CrashNotice.vue -->

<!-- Shown after the page was killed while on screen; the log helps diagnose phone-only crashes. -->
<template>
  <section
    v-if="report"
    role="status"
    class="mx-auto w-full max-w-2xl rounded-xl border border-[#e4e4de] border-l-4 border-l-[#b07f15] bg-[#ffffff] px-4 py-3"
  >
    <p class="text-[13px] font-medium text-[#121614]">Afronet restarted unexpectedly</p>
    <p class="mt-1 text-[12px] leading-relaxed text-[#606863]">
      Your device closed it while it was open, most likely because it ran low on memory. Your
      conversation has been kept.
    </p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="action in actions"
        :key="action.label"
        type="button"
        class="rounded-full border border-[#e4e4de] px-3 py-1 text-[12px] text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
        @click="action.run"
      >
        {{ action.label }}
      </button>
    </div>
    <pre
      v-if="open"
      class="afro-scroll mt-2 max-h-56 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-[#f7f7f4] p-2 text-[11px] leading-relaxed text-[#606863]"
      >{{ report.lines.join('\n') }}</pre
    >
  </section>
</template>

<script setup>
const { report, dismiss } = useCrashLog()
const open = ref(false)
const copied = ref(false)

const copy = async () => {
  if (!report.value) return
  try {
    await navigator.clipboard.writeText(report.value.lines.join('\n'))
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
  catch {
    open.value = true // clipboard blocked: show the log so it can be selected manually
  }
}

const actions = computed(() => [
  { label: open.value ? 'Hide details' : 'Show details', run: () => { open.value = !open.value } },
  { label: copied.value ? 'Copied' : 'Copy details', run: copy },
  { label: 'Dismiss', run: dismiss },
])
</script>
