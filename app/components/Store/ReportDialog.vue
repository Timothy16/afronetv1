<!-- app/components/Store/ReportDialog.vue -->

<!--
  Reporting an app or a review. Says plainly where the report goes, because people assume
  it reaches the developer and then write things they would not want them to read.
-->
<template>
  <UiModal
    :open="open"
    :title="`Report ${subject}`"
    description="Reports go to Afronet, not the developer. Nobody is reviewing them yet, but yours is kept."
    @close="emit('close')"
  >
    <div class="space-y-1.5" role="radiogroup" aria-label="Reason">
      <label
        v-for="r in reasons"
        :key="r"
        class="flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-[13.5px] text-[#121614]"
        :class="reason === r ? 'border-[#121614] bg-[#f7f7f4]' : 'border-[#e4e4de]'"
      >
        <input
          type="radio"
          name="afronet-report-reason"
          class="h-4 w-4 accent-[#0b5d3e]"
          :checked="reason === r"
          @change="reason = r"
        />
        {{ r }}
      </label>
    </div>

    <UiTextarea v-model="details" :rows="3" aria-label="Details" placeholder="Add details (optional)" class="mt-3" />

    <div class="mt-6 flex flex-wrap justify-end gap-2">
      <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton>
      <UiButton variant="danger" :disabled="!reason || sending" @click="submit">
        {{ sending ? 'Sending…' : 'Submit report' }}
      </UiButton>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  // What is being reported — an app name, or "review by Bisi A."
  subject: { type: String, default: '' },
})

const emit = defineEmits(['close'])

const { notify } = useAppLibrary()
const apiFetch = useRequestFetch()

const reasons = [
  'Doesn’t work as described',
  'Asks for permissions it doesn’t need',
  'Inappropriate or harmful content',
  'Scam or misleading payment',
  'Copyright or impersonation',
  'Privacy concern',
]

const reason = ref('')
const details = ref('')
const sending = ref(false)

/**
 * Sends the report and quotes the reference it was actually given.
 *
 * This used to answer with the same invented reference every time and keep nothing, which
 * told someone reporting a harmful app that it had been received. Nobody reads these yet,
 * but they are kept — a record can be read later, and cannot be written later.
 */
const submit = async () => {
  if (sending.value || !reason.value) return
  sending.value = true

  try {
    const res = await apiFetch('/api/apps/reports', {
      method: 'POST',
      body: {
        subject: props.subject,
        kind: props.subject.startsWith('review by') ? 'review' : 'app',
        reason: reason.value,
        details: details.value,
      },
    })
    notify(`Report received · reference ${res?.data?.reference ?? ''}`.trim(), 'success')
    reason.value = ''
    details.value = ''
    emit('close')
  } catch (e) {
    notify(e?.data?.message || 'That report could not be sent. Try again.', 'error')
  } finally {
    sending.value = false
  }
}
</script>
