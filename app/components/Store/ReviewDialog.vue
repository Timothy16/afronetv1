<!-- app/components/Store/ReviewDialog.vue -->

<!--
  Rating an app.

  There were three kinds here — a review, a bug report and a feature request — sharing one row
  per person. So filing a bug silently replaced the review you had already written, and took
  your stars out of the app's average with it. They were also messages to a developer who has
  nowhere to read them.

  So: one review, and whatever someone wants to say goes in it. A broken app gets two stars and
  a sentence about what broke, which the developer reads in the same place either way. Bug
  reports come back when there is a developer inbox for them to arrive in.

  Only someone who has the app can open this.
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

    <UiTextarea
      v-model="body"
      :rows="4"
      aria-label="Your review"
      placeholder="What do you like or dislike? If something is broken, say what happened."
      class="mt-4"
    />

    <p class="mt-2 text-[12px] text-[#8f9792]">Reviews are public and show your first name. Please be respectful.</p>

    <div class="mt-6 flex flex-wrap justify-end gap-2">
      <UiButton v-if="existing" variant="danger" :disabled="sending" class="mr-auto" @click="remove">
        Remove
      </UiButton>
      <UiButton variant="secondary" @click="emit('close')">Cancel</UiButton>
      <UiButton :disabled="!rating || body.trim().length < 4 || sending" @click="submit">
        {{ sending ? 'Saving…' : existing ? 'Save changes' : 'Post' }}
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

const { saveReview, removeReview, notify } = useAppLibrary()

const sending = ref(false)

const rating = ref(props.existing?.rating ?? 0)
const body = ref(props.existing?.body ?? '')

// Reset each time it opens, so yesterday's half-written review does not reappear.
watch(
  () => [props.open, props.existing],
  ([isOpen]) => {
    if (!isOpen) return
    rating.value = props.existing?.rating ?? 0
    body.value = props.existing?.body ?? ''
  },
)

/**
 * Posts the review and says what actually happened.
 *
 * It used to promise "visible after automated moderation", which described a step nobody
 * had built — a review appears straight away. Writing again edits what you said rather than
 * adding a second, which is why there is no second thing to post.
 */
const submit = async () => {
  if (sending.value || !rating.value) return
  sending.value = true

  const ok = await saveReview(props.appId, { rating: rating.value, body: body.value })

  sending.value = false
  if (!ok) return

  notify(props.existing ? 'Your review has been updated.' : 'Your review has been posted.', 'success')
  emit('close')
}

/** Taking back what you said, which also takes your stars out of the average. */
const remove = async () => {
  if (sending.value || !props.existing) return
  sending.value = true

  const ok = await removeReview(props.appId)

  sending.value = false
  if (!ok) return

  notify('Your review has been removed.', 'success')
  emit('close')
}
</script>
