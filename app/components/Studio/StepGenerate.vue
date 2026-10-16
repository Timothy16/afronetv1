<!-- app/components/Studio/StepGenerate.vue -->

<!--
  The last step: find out what the app will take, trim it until it fits, then build it.

  Planning is not a rescue for a short balance any more — it is how every build works. The
  reason is one ledger row: a developer on a full 20,000 asked for a JAMB chemistry quiz, the
  model was never told it had a ceiling, wrote until it hit 16,000, and was thrown away. The
  balance was never the problem. The app not fitting was, and nothing was watching for that.

  So the order is: describe, ask what it takes, untick until it fits, build. The estimate is
  the model's own judgement of its own forthcoming work, shown as ranges because it is
  approximate, and the build that follows is given a budget derived from it.
-->
<template>
  <div>
    <!-- Ready ------------------------------------------------------------->
    <div v-if="phase === 'idle'">
      <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614]">
        {{ planned ? 'What this will take' : 'Ready to generate' }}
      </h1>

      <dl class="mt-5 space-y-2 rounded-2xl bg-[#f7f7f4] p-4 text-[13.5px]">
        <div class="flex gap-3">
          <dt class="w-28 shrink-0 text-[#606863]">Idea</dt>
          <dd class="font-medium text-[#121614]">
            {{ trimming ? trimmed || 'Nothing selected yet' : summary.prompt }}
          </dd>
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

      <!-- Nothing can be built at all. The only useful thing to say is when that changes. -->
      <div v-if="!credits.canBuild" class="mt-4 rounded-2xl bg-[#faf3e3] p-4 text-[12.5px] leading-relaxed text-[#b07f15]">
        <p class="flex items-start gap-1.5">
          <i class="fa-solid fa-gauge-high mt-0.5 shrink-0 text-[11px]" aria-hidden="true"></i>
          <span>{{ credits.blockedReason }}</span>
        </p>
      </div>

      <!-- Before the plan: what the next press costs, and nothing more. -->
      <div v-else-if="!planned" class="mt-4 rounded-2xl bg-[#f7f7f4] p-4 text-[12.5px] leading-relaxed text-[#606863]">
        <p class="flex items-start gap-1.5">
          <i class="fa-solid fa-scale-balanced mt-0.5 shrink-0 text-[11px]" aria-hidden="true"></i>
          <span>
            Afronet will ask what each part of this would take to build, then show you the cost
            before anything is written. That check uses up to
            <strong class="text-[#121614]">{{ (credits.planCost ?? 0).toLocaleString() }}</strong>
            of your
            <strong class="text-[#121614]">{{ creditsLeft.toLocaleString() }}</strong> tokens.
          </span>
        </p>
        <p v-if="planError" class="mt-2 font-medium text-[#b22c26]">{{ planError }}</p>
        <p v-else class="mt-1 text-[#8f9792]">It takes a few seconds.</p>
      </div>

      <!--
        After the plan.

        The totals include the overhead, because the description and the rules are paid for out
        of the same balance before a line of the app is written. Comparing the bare feature sum
        would open the button about 1,600 tokens too early.
      -->
      <div v-else class="mt-4 rounded-2xl border border-[#e4e4de] p-4">
        <p class="text-[12.5px] leading-relaxed text-[#606863]">
          <template v-if="features.length > 1">
            Here is what you asked for, and what each part would take. Untick anything you can do
            without — what is left is what gets built.
          </template>
          <template v-else>
            There is only one thing in your description, so there is nothing to untick.
          </template>
        </p>

        <ul v-if="features.length > 1" class="mt-3 space-y-1">
          <li v-for="f in features" :key="f.id">
            <button
              type="button"
              class="flex w-full items-start gap-2.5 rounded-xl px-2 py-1.5 text-left text-[13.5px] leading-snug transition-colors hover:bg-[#f7f7f4]"
              :aria-pressed="isKept(f.id) ? 'true' : 'false'"
              @click="emit('toggle', f.id)"
            >
              <span
                class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border"
                :class="isKept(f.id) ? 'border-[#0b5d3e] bg-[#0b5d3e] text-[#ffffff]' : 'border-[#c9cdc9]'"
              >
                <i v-if="isKept(f.id)" class="fa-solid fa-check text-[9px]" aria-hidden="true"></i>
              </span>
              <span class="flex-1" :class="isKept(f.id) ? 'text-[#121614]' : 'text-[#8f9792] line-through'">
                {{ f.text }}
              </span>
              <span
                v-if="f.max"
                class="mt-0.5 shrink-0 text-[11.5px] tabular-nums"
                :class="isKept(f.id) ? 'text-[#606863]' : 'text-[#c9cdc9]'"
              >
                {{ f.min.toLocaleString() }}–{{ f.max.toLocaleString() }}
              </span>
            </button>
          </li>
        </ul>

        <div class="mt-3 border-t border-[#e4e4de] pt-3">
          <p class="flex items-baseline justify-between gap-3 text-[13px]">
            <span class="font-medium text-[#121614]">Ticked</span>
            <span
              class="font-semibold tabular-nums"
              :class="overBudget || tooBig ? 'text-[#b22c26]' : 'text-[#147a4c]'"
            >
              {{ estimate.min.toLocaleString() }}–{{ estimate.max.toLocaleString() }}
              of your {{ creditsLeft.toLocaleString() }}
            </span>
          </p>
          <p class="mt-1 text-[11.5px] text-[#8f9792]">
            Includes about {{ (credits.overhead ?? 0).toLocaleString() }} for your description and
            the rules every app is built against.
          </p>

          <p v-if="tooBig" class="mt-2 text-[12px] font-medium leading-relaxed text-[#b22c26]">
            That is larger than any Afronet app can be. Apps here are single files that run on a
            phone — untick enough to come under
            {{ (credits.ceiling ?? 0).toLocaleString() }} tokens of app.
          </p>
          <p v-else-if="overBudget" class="mt-2 text-[12px] font-medium leading-relaxed text-[#b22c26]">
            That is more than you have left. Untick something else to generate.
          </p>
          <p v-else-if="tooLittleLeft" class="mt-2 text-[12px] font-medium leading-relaxed text-[#b07f15]">
            There is not enough left to describe an app. Tick something back on.
          </p>
        </div>

        <p class="mt-3 flex items-start gap-1.5 text-[12px] leading-relaxed text-[#8f9792]">
          <i class="fa-solid fa-circle-info mt-0.5 shrink-0 text-[10px]" aria-hidden="true"></i>
          <span>
            These are estimates, not a promise. If an app runs over anyway that is our mistake,
            not yours, and those tokens are not taken from your balance. Your allowance goes back
            to {{ (credits.allowance ?? 0).toLocaleString() }} on {{ formatDate(credits.renewsOn) }}.
          </span>
        </p>
      </div>
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

    <!-- Nothing left this week --------------------------------------------->
    <div v-else class="py-2 text-center">
      <span class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#faf3e3] text-[#b07f15]">
        <i class="fa-solid fa-gauge-high text-[20px]" aria-hidden="true"></i>
      </span>
      <h1 class="mt-3 text-[20px] font-semibold text-[#121614]">That’s this week’s tokens</h1>
      <p class="mx-auto mt-1 max-w-sm text-[13.5px] leading-relaxed text-[#606863]">
        {{
          failure ||
          (credits.renewsOn
            ? `Your allowance goes back to ${(credits.allowance ?? 0).toLocaleString()} tokens on ${formatDate(credits.renewsOn)}.`
            : '')
        }}
        You can still edit apps you have already built, and publish them.
      </p>
    </div>
  </div>
</template>

<script setup>
import { formatDate } from '~/data/store'
import { generateStages } from '~/data/studio'

const props = defineProps({
  // idle | running | failed | limit
  phase: { type: String, default: 'idle' },
  stage: { type: Number, default: 0 },
  summary: { type: Object, required: true },
  /** What the server said went wrong, in its words. */
  failure: { type: String, default: '' },
  creditsLeft: { type: Number, default: 0 },
  credits: { type: Object, required: true },
  /** What the plan found, or the mechanical split if the plan could not be had. */
  features: { type: Array, default: () => [] },
  /** The ids still ticked. */
  kept: { type: Array, default: () => [] },
  /** The description rebuilt from what is ticked. */
  trimmed: { type: String, default: '' },
  planned: { type: Boolean, default: false },
  planError: { type: String, default: '' },
  /** What the ticked features are estimated to cost in total, overhead included. */
  estimate: { type: Object, default: () => ({ min: 0, max: 0 }) },
})

const emit = defineEmits(['toggle'])

const trimming = computed(() => props.planned && props.features.length > 0)

const isKept = (id) => props.kept.includes(id)

/** The app itself, with the fixed overhead taken back off. */
const outputEstimate = computed(() => Math.max(0, props.estimate.max - (props.credits.overhead ?? 0)))

// Too big for any balance: no allowance makes a 20,000-token app into an Afronet app.
const tooBig = computed(() => props.planned && outputEstimate.value > (props.credits.ceiling ?? Infinity))

// The top of the range, not the bottom. Blocking a build that would have fitted costs a
// developer a slightly smaller app; letting one through that does not costs them a wait and
// costs us the tokens. The cheaper mistake is the one to make.
const overBudget = computed(() => props.planned && props.estimate.max > props.creditsLeft)

// Fifteen characters is what the server asks for. Below it the button is refused, so the
// reason has to be on screen rather than left for the developer to work out.
const tooLittleLeft = computed(
  () => trimming.value && props.kept.length > 0 && props.trimmed.trim().length < 15,
)
</script>
