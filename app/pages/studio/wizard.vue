<!-- app/pages/studio/wizard.vue -->

<!--
  Describing an app, in five steps: idea, type, what it can do, how it looks, generate.
  (The design had a sixth step asking how it should behave offline. This release does not
  support using apps offline, so asking would set an expectation nothing can keep.)

  One page holds the step index and the answers; each step is its own component. A
  half-finished idea is deliberately not deep-linkable — refreshing should not drop someone
  into step four with nothing behind it — and the back button walks the steps rather than
  leaving the flow.

  The generation is real: the server calls the model, writes the app and stores it, with the
  API key and the quota kept there. Only the list of stages is walked on a timer, and it
  stops short of the last one until the server answers, so it cannot finish ahead of the
  work. The quota can genuinely run out, the call can genuinely fail, and a draft exists
  only once there is an app to put in it.
-->
<template>
  <div class="mx-auto max-w-3xl">
    <button
      class="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#606863] hover:text-[#121614]"
      @click="back"
    >
      <i class="fa-solid fa-arrow-left text-[11px]" aria-hidden="true"></i>
      Back
    </button>

    <ol class="mb-8 flex gap-1.5" aria-label="Progress">
      <li v-for="(s, i) in stepNames" :key="s" class="flex-1">
        <span class="block h-1 rounded-full" :class="i <= step ? 'bg-[#0b5d3e]' : 'bg-[#e4e4de]'" />
        <span
          class="mt-2 hidden text-[11.5px] font-medium sm:block"
          :class="i === step ? 'text-[#121614]' : 'text-[#8f9792]'"
        >
          {{ s }}
        </span>
      </li>
    </ol>

    <div class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6 sm:p-8">
      <StudioStepIdea v-if="step === 0" v-model="draft.prompt" />
      <StudioStepType v-else-if="step === 1" v-model="draft.category" />
      <StudioStepDesign v-else-if="step === 2" v-model="draft.design" />
      <StudioStepGenerate
        v-else
        :phase="phase"
        :stage="stage"
        :summary="summary"
        :failure="failure"
        :credits-left="creditsLeft"
        :credits="credits"
      />

      <div class="mt-8 flex flex-wrap justify-end gap-2 border-t border-[#e4e4de] pt-5">
        <template v-if="step < lastStep">
          <UiButton :disabled="!canContinue" @click="step += 1">Continue</UiButton>
        </template>

        <template v-else-if="phase === 'idle'">
          <UiButton size="lg" @click="start">
            <template #icon><i class="fa-solid fa-wand-magic-sparkles text-[12px]" aria-hidden="true"></i></template>
            Generate app
          </UiButton>
        </template>

        <template v-else-if="phase === 'failed'">
          <UiButton variant="secondary" @click="editDescription">Edit description</UiButton>
          <UiButton @click="start">Retry generation</UiButton>
        </template>

        <template v-else-if="phase === 'limit'">
          <UiButton variant="secondary" to="/studio/create">Browse templates</UiButton>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { appTypes, findTemplate, generateStages, nameFromPrompt } from '~/data/studio'

definePageMeta({ layout: 'studio' })
useHead({ title: 'Build with AI · Afronet Studio' })

const route = useRoute()

const { credits, creditsLeft, createDevApp, notify } = useStudio()

const stepNames = ['Idea', 'Type', 'Design', 'Generate']
const lastStep = stepNames.length - 1

// A starting point only. What gets built comes from the description, not from this.
const template = findTemplate(String(route.query.template ?? ''))

const step = ref(0)

const draft = ref({
  prompt: template?.prompt ?? '',
  category: template?.category ?? 'education',
  design: {
    name: '',
    tone: 'brand',
    layout: 'cards',
    fontScale: false,
    highContrast: false,
  },
})

const phase = ref('idle')
const stage = ref(0)

const canContinue = computed(() => (step.value === 0 ? draft.value.prompt.trim().length >= 15 : true))

const summary = computed(() => ({
  prompt: draft.value.prompt,
  type: appTypes.find((t) => t.id === draft.value.category)?.label ?? '',
  name: draft.value.design.name.trim() || nameFromPrompt(draft.value.prompt),
}))

const back = () => {
  if (step.value > 0) {
    step.value -= 1
    return
  }
  navigateTo('/studio/create')
}

const editDescription = () => {
  phase.value = 'idle'
  stage.value = 0
  step.value = 0
}

// The run. Client-only, and every timer is cleared on the way out, so a developer who
// leaves mid-generation does not come back to a draft they never saw being made.
let timer = null

const clear = () => {
  if (timer) clearTimeout(timer)
  timer = null
}

/**
 * The stages step forward while the server is writing the app, and stop at the last one until
 * it answers. Writing an app takes twenty to forty seconds, so something has to move; what it
 * must not do is finish early and leave a developer watching a completed progress bar.
 */
const advance = () => {
  clear()
  if (!import.meta.client) return
  if (stage.value >= generateStages.length - 1) return

  timer = setTimeout(() => {
    stage.value += 1
    advance()
  }, 4000)
}

const failure = ref('')

const start = async () => {
  phase.value = 'running'
  stage.value = 0
  failure.value = ''
  advance()

  try {
    const app = await createDevApp({
      name: summary.value.name,
      prompt: draft.value.prompt,
      category: draft.value.category,
      tone: draft.value.design.tone,
      fontScale: draft.value.design.fontScale ? 'large' : 'normal',
      highContrast: draft.value.design.highContrast,
      layout: draft.value.design.layout,
      // Only a starting icon, and only when they began from an example. It is theirs to change
      // in the builder, and it has no bearing on what gets built.
      icon: template?.icon ?? '',
    })
    if (!app) throw new Error('No build came back')

    clear()
    stage.value = generateStages.length
    notify('Your app is ready · try it in the preview.', 'success')
    navigateTo(`/studio/builder/${app.id}`)
  } catch (e) {
    clear()
    // The server says why — out of allowance, the model refused, the app came back too long.
    // Whatever it was, the developer's answers are still on screen and can be retried.
    const message = e?.data?.message ?? e?.message ?? ''
    phase.value = e?.statusCode === 429 || e?.data?.statusCode === 429 ? 'limit' : 'failed'
    failure.value = message
    if (message) notify(message, 'error')
  }
}

onBeforeUnmount(clear)
</script>
