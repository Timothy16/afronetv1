<!-- app/components/Studio/StepGenerate.vue -->

<!--
  Step five: the summary, then the generation itself.

  Four states, all of which a developer will meet: ready, running, failed, and out of quota.

  This one really does call a model. The key, the quota and the limits are on the server, so
  what this screen does is describe what is happening and report what came back — including the
  failure, in the server's own words, because "the app came out longer than the limit allows"
  tells a developer what to do next and a generic error does not.

  The stages step forward while the server works and stop before the last one. Writing an app
  takes twenty to forty seconds; a progress list that completed early would be lying about a
  wait that is still going on.
-->
<template>
  <div>
    <!-- Ready ------------------------------------------------------------->
    <div v-if="phase === 'idle'">
      <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614]">
        Ready to generate
      </h1>

      <dl class="mt-5 space-y-2 rounded-2xl bg-[#f7f7f4] p-4 text-[13.5px]">
        <div class="flex gap-3">
          <dt class="w-28 shrink-0 text-[#606863]">Idea</dt>
          <dd class="font-medium text-[#121614]">{{ summary.prompt }}</dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-28 shrink-0 text-[#606863]">Type</dt>
          <dd class="font-medium text-[#121614]">{{ summary.type }}</dd>
        </div>
        <div class="flex gap-3">
          <dt class="w-28 shrink-0 text-[#606863]">Name</dt>
          <dd class="font-medium text-[#121614]">{{ summary.name }}</dd>
        </div>
      </dl>

      <p class="mt-4 flex items-start gap-1.5 text-[12.5px] text-[#606863]">
        <i class="fa-solid fa-gauge-high mt-0.5 text-[11px]" aria-hidden="true"></i>
        Uses 1 of your {{ creditsLeft }} remaining generations. It takes about half a minute.
      </p>
    </div>

    <!-- Running, or stopped partway ---------------------------------------->
    <div v-else-if="phase === 'running' || phase === 'failed'">
      <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614]">
        {{ phase === 'failed' ? 'Generation stopped' : 'Writing your app…' }}
      </h1>

      <ol class="mt-5 space-y-3">
        <li
          v-for="(s, i) in generateStages"
          :key="s"
          class="flex items-center gap-3 text-[14px]"
          :class="i <= stage ? 'text-[#121614]' : 'text-[#8f9792]'"
        >
          <i
            v-if="i < stage"
            class="fa-solid fa-circle-check w-4 text-center text-[14px] text-[#0b5d3e]"
            aria-hidden="true"
          ></i>
          <i
            v-else-if="phase === 'failed' && i === stage"
            class="fa-solid fa-triangle-exclamation w-4 text-center text-[14px] text-[#b22c26]"
            aria-hidden="true"
          ></i>
          <UiSpinner v-else-if="i === stage" />
          <span v-else class="w-4 text-center">
            <span class="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#e4e4de]" />
          </span>
          {{ s }}
        </li>
      </ol>

      <p v-if="phase === 'running'" class="mt-5 text-[12.5px] text-[#8f9792]">
        Leaving this page cancels it, and the generation is still counted.
      </p>

      <p v-if="phase === 'failed'" class="mt-5 rounded-2xl bg-[#b22c26]/10 p-4 text-[13px] leading-relaxed text-[#b22c26]">
        {{ failure || 'The app could not be generated. Your answers are saved — try again, or describe it differently.' }}
      </p>
    </div>

    <!-- Nothing left this month -------------------------------------------->
    <div v-else class="py-2 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faf3e3] text-[#b07f15]">
        <i class="fa-solid fa-gauge-high text-[20px]" aria-hidden="true"></i>
      </span>
      <h1 class="mt-3 text-[20px] font-semibold text-[#121614]">That’s all your generations for now</h1>
      <p class="mx-auto mt-1 max-w-sm text-[13.5px] leading-relaxed text-[#606863]">
        {{ failure || (credits.resets ? `Your quota resets on ${formatDate(credits.resets)}.` : '') }}
        You can still edit apps you have already built, and publish them.
      </p>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '~/data/store'
import { generateStages } from '~/data/studio'

defineProps({
  // idle | running | failed | limit
  phase: { type: String, default: 'idle' },
  stage: { type: Number, default: 0 },
  summary: { type: Object, required: true },
  /** What the server said went wrong, in its words. */
  failure: { type: String, default: '' },
  creditsLeft: { type: Number, default: 0 },
  credits: { type: Object, required: true },
})
</script>
