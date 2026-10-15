<!-- app/pages/studio/apps/[id]/publish.vue -->

<!--
  Submitting an app, and what happens to it afterwards. Four states, and which one a
  developer sees depends only on where their app actually is:

    checklist   not submitted — what is still missing, each with a link to the screen that fixes it
    in review   the automated checks are running
    rejected    a check failed — what it found, to fix and resubmit
    published   live — with a link to the real listing

  There used to be five review stages and four button presses here, three of which incremented
  a number and did nothing: a progress bar for a review process that did not exist. What is
  left is one press and one real gate. The checks read the app's own code, and an app that
  fails them never reaches the catalogue.

  A human reviewer belongs here eventually, between the checks and the store. Nothing about
  this screen has to change when it arrives: a rejected state and comments to resolve are
  already what it would use.
-->
<template>
  <div v-if="app">
    <StudioAppSubnav :app="app" />

    <!-- Live ------------------------------------------------------------->
    <section
      v-if="app.status === 'published'"
      class="flex flex-col gap-4 rounded-3xl bg-[#eaf3ee] p-6 sm:flex-row sm:items-center"
    >
      <i class="fa-solid fa-circle-check shrink-0 text-[28px] text-[#0b5d3e]" aria-hidden="true"></i>
      <div class="flex-1">
        <p class="text-[17px] font-semibold text-[#0b5d3e]">Approved and published</p>
        <p class="text-[13.5px] text-[#0b5d3e]/80">
          {{ app.name }} {{ app.version }} is live in the Afronet App Store.
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <UiButton variant="secondary" :to="`/store/app/${app.storeAppId}`">View public listing</UiButton>
        <UiButton :to="`/studio/apps/${app.id}`">Manage app</UiButton>
      </div>
    </section>

    <!-- Sent back -------------------------------------------------------->
    <section v-else-if="app.status === 'rejected'" class="rounded-3xl border border-[#b22c26]/20 bg-[#ffffff] p-6">
      <p class="flex items-center gap-2 text-[16px] font-semibold text-[#b22c26]">
        <i class="fa-solid fa-triangle-exclamation text-[14px]" aria-hidden="true"></i>
        This app did not pass the checks
      </p>
      <p class="mt-1 text-[13.5px] leading-relaxed text-[#606863]">
        Each one below is something the sandbox would block at runtime. Fix them in the builder,
        or describe the app differently and generate it again. It is not visible to anyone yet.
      </p>

      <ul class="mt-4 space-y-3">
        <li
          v-for="c in app.reviewComments"
          :key="c.id"
          class="rounded-2xl border border-[#e4e4de] p-4"
          :class="c.resolved ? 'opacity-60' : ''"
        >
          <div class="flex flex-wrap items-center justify-between gap-3">
            <UiBadge tone="muted">{{ c.area }}</UiBadge>
            <span class="text-[12px] text-[#8f9792]">{{ formatDate(c.date) }}</span>
          </div>
          <p class="mt-2 text-[13.5px] leading-relaxed text-[#121614]">{{ c.body }}</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <UiButton
              size="sm"
              :variant="c.resolved ? 'ghost' : 'secondary'"
              @click="resolveComment(app.id, c.id, !c.resolved)"
            >
              {{ c.resolved ? 'Resolved' : 'Mark as resolved' }}
            </UiButton>
            <UiButton size="sm" variant="ghost" :to="`/studio/apps/${app.id}/listing`">Go to the listing</UiButton>
          </div>
        </li>
      </ul>

      <UiButton class="mt-4" :disabled="unresolved > 0" @click="submitForReview(app.id)">
        {{ unresolved > 0 ? `${unresolved} still to resolve` : 'Resubmit for review' }}
      </UiButton>
    </section>

    <!-- Being checked ------------------------------------------------------>
    <section
      v-else-if="app.status === 'in_review'"
      class="flex flex-col items-center gap-3 rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-10 text-center"
    >
      <UiSpinner />
      <h2 class="text-[16px] font-semibold text-[#121614]">Running the automated checks</h2>
      <p class="max-w-sm text-[13px] leading-relaxed text-[#606863]">
        Reading {{ app.name }}’s code to make sure it stays inside the sandbox. If it passes, it
        goes straight into the store.
      </p>
    </section>

    <!-- Not submitted ---------------------------------------------------->
    <div v-else class="grid gap-6 lg:grid-cols-[1fr_300px]">
      <section class="rounded-3xl border border-[#e4e4de] bg-[#ffffff]">
        <div class="flex items-center justify-between gap-3 border-b border-[#e4e4de] px-6 py-4">
          <h2 class="text-[16px] font-semibold text-[#121614]">Publishing checklist</h2>
          <span class="text-[13px] font-medium text-[#606863]">{{ done }}/{{ checklist.length }} complete</span>
        </div>
        <ul class="divide-y divide-[#e4e4de]">
          <li v-for="item in checklist" :key="item.label" class="flex items-center gap-3 px-6 py-3.5">
            <i
              class="fa-solid w-4 shrink-0 text-center text-[14px]"
              :class="{
                'fa-circle-check text-[#0b5d3e]': item.state === 'done',
                'fa-triangle-exclamation text-[#b07f15]': item.state === 'attention',
                'fa-circle text-[#e4e4de]': item.state === 'todo',
              }"
              aria-hidden="true"
            ></i>
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-medium text-[#121614]">{{ item.label }}</p>
              <p class="text-[12.5px]" :class="item.state === 'attention' ? 'text-[#b07f15]' : 'text-[#606863]'">
                {{ item.note }}
              </p>
            </div>
            <NuxtLink
              v-if="item.state !== 'done' && item.fix"
              :to="item.fix"
              class="whitespace-nowrap text-[13px] font-medium text-[#0b5d3e] hover:underline"
            >
              Fix
            </NuxtLink>
          </li>
        </ul>
      </section>

      <aside class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6 lg:self-start">
        <p class="text-[15px] font-semibold text-[#121614]">{{ ready ? 'Ready to submit' : 'Almost there' }}</p>
        <p class="mt-1 text-[13px] leading-relaxed text-[#606863]">
          {{
            ready
              ? 'Anything marked with a warning won’t block review, but a reviewer will look at it.'
              : 'Finish the remaining items to submit.'
          }}
        </p>
        <UiButton block size="lg" class="mt-4" :disabled="!ready" @click="submitForReview(app.id)">
          Submit for review
        </UiButton>
        <p class="mt-3 text-[11.5px] text-[#8f9792]">
          There is no reviewer yet, so the controls stand in for one. Approving really does
          publish: the app appears in the store and can be downloaded.
        </p>
      </aside>
    </div>
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="Project not found" body="It may have been archived or deleted.">
      <template #action><UiButton to="/studio/apps">My Apps</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { formatDate } from '~/data/store'
import { publishChecklist } from '~/data/studio'

definePageMeta({ layout: 'studio' })

const route = useRoute()

const { findDevApp, submitForReview, resolveComment } = useStudio()

const app = computed(() => findDevApp(String(route.params.id || '')))

useHead({ title: computed(() => `Publish · ${app.value?.name ?? 'App'} · Afronet Studio`) })

const checklist = computed(() => (app.value ? publishChecklist(app.value) : []))
const done = computed(() => checklist.value.filter((i) => i.state === 'done').length)
const ready = computed(() => checklist.value.every((i) => i.state !== 'todo'))
const unresolved = computed(() => app.value?.reviewComments?.filter((c) => !c.resolved).length ?? 0)

// An app sitting in "being checked" is one whose checks are not running — either the page was
// reloaded mid-flight, or it was submitted before this screen worked this way. Either way the
// spinner would be describing nothing, so opening the screen starts the run for real. It
// settles on published or rejected, so this cannot repeat.
onMounted(() => {
  if (app.value?.status === 'in_review') submitForReview(app.value.id)
})
</script>
