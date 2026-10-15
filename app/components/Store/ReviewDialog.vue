<!-- app/components/Store/ReviewDialog.vue -->

<!--
  Rating an app, and the two things people actually want to say instead — this is broken,
  or please add this. Separating them keeps bug reports out of the star average and gives
  the developer something they can act on.

  Only someone who has the app, or has paid for it, can open this.
-->
<template>
  <UiModal :open="open" :title="existing ? 'Edit your review' : 'Rate this app'" @close="emit('close')">
    <div class="flex gap-1" role="radiogroup" aria-label="Rating">
      <button
        v-for="n in 5"
        :key="n"
        role="radio"
        :aria-checked="rating === n ? 'true' : 'false'"
        :aria-label="`${n} ${n === 1 ? 'star' : 'stars'}`"
        class="p-1"
        @click="rating = n"
      >
        <i
          class="fa-solid fa-star text-[26px]"
          :class="n <= rating ? 'text-[#b07f15]' : 'text-[#e4e4de]'"
          aria-hidden="true"
        ></i>
      </button>
    </div>

    <div class="mt-4">
      <UiSegmentedControl v-model="type" :options="kinds" size="sm" />
    </div>

    <UiTextarea
      v-model="body"
      :rows="4"
      :aria-label="type === 'bug' ? 'What went wrong' : 'Your review'"
      :placeholder="type === 'bug' ? 'What happened? What did you expect?' : 'What do you like or dislike?'"
      class="mt-3"
    />

    <p class="mt-2 text-[12px] text-[#8f9792]">Reviews are public and show your first name. Please be respectful.</p>

    <div class="mt-6 flex flex-wrap justify-end gap-2">
      <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton>
      <UiButton :disabled="!rating || body.trim().length < 4" @click="submit">
        {{ existing ? 'Save changes' : 'Post' }}
      </UiButton>
    </div>
  </UiModal>
</template>

<script setup>
const props = defineProps({
  appId: { type: String, required: true },
  open: { type: Boolean, default: false },
  // The person's own review, when they are editing rather than writing.
  existing: { type: Object, default: null },
})

const emit = defineEmits(['close'])

const { online, purchases, addReview, updateReview, notify } = useAppLibrary()

const kinds = [
  { value: 'review', label: 'Review' },
  { value: 'bug', label: 'Report a bug' },
  { value: 'feature', label: 'Suggest a feature' },
]

const rating = ref(props.existing?.rating ?? 0)
const type = ref(props.existing?.type ?? 'review')
const body = ref(props.existing?.body ?? '')

// Reset each time it opens, so yesterday's half-written review does not reappear.
watch(
  () => [props.open, props.existing],
  ([isOpen]) => {
    if (!isOpen) return
    rating.value = props.existing?.rating ?? 0
    type.value = props.existing?.type ?? 'review'
    body.value = props.existing?.body ?? ''
  },
)

const submit = () => {
  if (props.existing) {
    updateReview(props.existing.id, { rating: rating.value, type: type.value, body: body.value })
  } else {
    addReview({
      appId: props.appId,
      rating: rating.value,
      type: type.value,
      body: body.value,
      verified: purchases.value.some((p) => p.appId === props.appId && p.status === 'verified'),
    })
  }
  notify(
    `${props.existing ? 'Review updated' : 'Review posted'} · ${
      online.value ? 'visible after automated moderation.' : 'saved — it will post when you reconnect.'
    }`,
    'success',
  )
  emit('close')
}
</script>
