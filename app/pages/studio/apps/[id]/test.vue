<!-- app/pages/studio/apps/[id]/test.vue -->

<!--
  The test report: what can be said truthfully about a generated build, read from the build
  itself, with the preview beside it so anything flagged can be looked at.

  A warning does not block publishing. It is a judgement call, and saying "a reviewer will
  look at this" is more honest than refusing to let someone submit.

  There is no build-and-validation service behind this yet, so there are no claims here that
  would need one — no cold-start timing, no memory figure, no safety scan. What is real is
  the consequence: a passing run is what moves a draft to "ready to submit", and any later
  change to the build clears the result.
-->
<template>
  <div v-if="app">
    <StudioAppSubnav :app="app">
      <template #actions>
        <UiButton :disabled="running" @click="run">
          <template #icon>
            <UiSpinner v-if="running" />
            <i v-else class="fa-solid fa-flask text-[11px]" aria-hidden="true"></i>
          </template>
          {{ running ? 'Running…' : app.testedAt ? 'Re-run tests' : 'Run tests' }}
        </UiButton>
      </template>
    </StudioAppSubnav>

    <div class="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div class="space-y-4">
        <section class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-[16px] font-semibold text-[#121614]">Test report</h2>
              <p class="text-[12.5px] text-[#606863]">
                {{
                  app.testedAt
                    ? `Last run ${formatDate(app.testedAt)}`
                    : 'Not run since the last change.'
                }}
              </p>
            </div>
            <UiBadge v-if="app.testedAt" :tone="worst === 'fail' ? 'danger' : worst === 'warn' ? 'gold' : 'success'">
              {{ worst === 'fail' ? '1 failure' : worst === 'warn' ? `${warnings} to look at` : 'All checks passed' }}
            </UiBadge>
          </div>

          <ul class="mt-4 divide-y divide-[#e4e4de]">
            <li v-for="(check, i) in checks" :key="check.name" class="flex items-start gap-3 py-3">
              <UiSpinner v-if="running && i === step" />
              <i
                v-else-if="shown(i)"
                class="fa-solid w-4 text-center text-[14px]"
                :class="{
                  'fa-circle-check text-[#0b5d3e]': check.result === 'pass',
                  'fa-triangle-exclamation text-[#b07f15]': check.result === 'warn',
                  'fa-circle-xmark text-[#b22c26]': check.result === 'fail',
                }"
                aria-hidden="true"
              ></i>
              <span v-else class="w-4 text-center">
                <span class="inline-block h-3.5 w-3.5 rounded-full border-2 border-[#e4e4de]" />
              </span>

              <div class="min-w-0 flex-1">
                <p class="text-[14px] font-medium text-[#121614]">{{ check.name }}</p>
                <p
                  v-if="shown(i)"
                  class="text-[12.5px]"
                  :class="check.result === 'fail' ? 'text-[#b22c26]' : check.result === 'warn' ? 'text-[#b07f15]' : 'text-[#606863]'"
                >
                  {{ check.detail }}
                </p>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="app.testedAt" class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-5">
          <h3 class="text-[14px] font-semibold text-[#121614]">Package and permissions</h3>
          <dl class="mt-3 space-y-1.5 text-[13px]">
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Download size</dt>
              <dd class="font-medium text-[#121614]">{{ formatMB(app.packageMB) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Installed size (estimated)</dt>
              <dd class="font-medium text-[#121614]">{{ formatMB(app.installedMB) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Files</dt>
              <dd class="text-right font-medium text-[#121614]">{{ (app.fileNames ?? []).join(', ') || 'none' }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Needs a connection for</dt>
              <dd class="text-right font-medium text-[#121614]">{{ needs.length ? needs.join(', ') : 'Nothing' }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-[12px] font-medium text-[#121614]">Known limitation</p>
          <p class="text-[12.5px] leading-relaxed text-[#606863]">
            Anything a user does in this app is kept only while it is open. Closing or reloading
            it starts them over, because an app in the sandbox has no storage of its own yet.
          </p>
        </section>

        <UiButton v-if="app.testedAt" :to="nextStep.to">{{ nextStep.label }}</UiButton>
      </div>

      <div><StudioPreviewPane :app="app" /></div>
    </div>
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="Project not found" body="It may have been archived or deleted.">
      <template #action><UiButton to="/studio/apps">My Apps</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { formatDate, formatMB } from '~/data/store'
import { connectionNeeds, testChecks } from '~/data/studio'

definePageMeta({ layout: 'studio' })

const route = useRoute()

const { findDevApp, recordTestRun } = useStudio()

const app = computed(() => findDevApp(String(route.params.id || '')))

useHead({ title: computed(() => `Test · ${app.value?.name ?? 'App'} · Afronet Studio`) })

const checks = computed(() => (app.value ? testChecks(app.value) : []))
const needs = computed(() => (app.value ? connectionNeeds(app.value.config) : []))

const warnings = computed(() => checks.value.filter((c) => c.result === 'warn').length)
const worst = computed(() => {
  if (checks.value.some((c) => c.result === 'fail')) return 'fail'
  return warnings.value ? 'warn' : 'pass'
})

const nextStep = computed(() =>
  app.value.storeAppId
    ? { to: `/studio/apps/${app.value.id}`, label: 'Continue to the update' }
    : { to: `/studio/apps/${app.value.id}/publish`, label: 'Continue to the publishing checklist' },
)

// Checks reveal themselves one at a time while running, and stay revealed once the app has
// a recorded test result.
const running = ref(false)
const step = ref(0)

const shown = (i) => (running.value ? i < step.value : Boolean(app.value.testedAt))

let timer = null

const run = () => {
  if (!import.meta.client) return
  running.value = true
  step.value = 0
  const tick = () => {
    if (step.value >= checks.value.length) {
      running.value = false
      recordTestRun(app.value.id)
      return
    }
    step.value += 1
    timer = setTimeout(tick, 380)
  }
  timer = setTimeout(tick, 380)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
