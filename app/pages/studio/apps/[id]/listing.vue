<!-- app/pages/studio/apps/[id]/listing.vue -->

<!--
  The store listing: what a user reads before deciding whether to spend data on this app.
  Edited on the left, shown as it will appear on the right, because the gap between "I
  wrote a description" and "this is what people see" is where bad listings come from.

  The required fields are required for a reason, and each says why: a one-word description
  tells a buyer nothing.

  There are no screenshots. The button here produced a drawn placeholder in the app's colour
  rather than a picture of the app, and publishing was gated on having two of them — so the
  only way to reach the store was to fabricate two images nobody had seen. A real capture
  means rendering the stored files server-side, since the sandbox is cross-origin by design
  and nothing in the browser can see inside it. Until that exists, the listing says what is
  true about the app and shows none of what is not.
-->
<template>
  <div v-if="app">
    <StudioAppSubnav :app="app">
      <template #actions>
        <UiButton :disabled="!complete" @click="save">
          {{ complete ? 'Save listing' : 'Fill the required fields' }}
        </UiButton>
      </template>
    </StudioAppSubnav>

    <div class="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section class="space-y-5 rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-6">
        <div class="flex items-center gap-4">
          <StoreAppIcon :icon="app.icon" :tone="app.config.tone" size="lg" />
          <p class="text-[13px] text-[#606863]">
            The icon and theme are set in the builder.<br />
            <NuxtLink :to="`/studio/builder/${app.id}`" class="font-medium text-[#0b5d3e] hover:underline">
              Change them
            </NuxtLink>
          </p>
        </div>

        <UiField label="Title" :hint="`${app.name.length}/30`">
          <UiInput :model-value="app.name" maxlength="30" @update:model-value="type({ name: $event })" />
        </UiField>

        <UiField
          label="Short description"
          :hint="
            app.tagline.length < 10
              ? 'At least 10 characters — this is the line shown in lists and search'
              : `${app.tagline.length}/80 · shown in lists and search`
          "
        >
          <UiInput :model-value="app.tagline" maxlength="80" @update:model-value="type({ tagline: $event })" />
        </UiField>

        <UiField
          label="Full description"
          :hint="
            app.description.length < 40
              ? 'At least 40 characters — say who it is for and what it does'
              : `${app.description.length} characters`
          "
        >
          <UiTextarea :model-value="app.description" :rows="5" @update:model-value="type({ description: $event })" />
        </UiField>

        <UiField label="Category">
          <UiSelect :model-value="app.category" :options="categories" @update:model-value="update({ category: $event })" />
        </UiField>

        <div>
          <p class="mb-1.5 text-[13px] font-medium text-[#121614]">Feature highlights</p>
          <ul v-if="app.features.length" class="space-y-1.5">
            <li
              v-for="f in app.features"
              :key="f"
              class="flex items-center justify-between gap-3 rounded-lg bg-[#f7f7f4] px-3 py-2 text-[13.5px] text-[#121614]"
            >
              {{ f }}
              <button :aria-label="`Remove ${f}`" @click="update({ features: app.features.filter((x) => x !== f) })">
                <i class="fa-solid fa-xmark text-[11px] text-[#8f9792]" aria-hidden="true"></i>
              </button>
            </li>
          </ul>
          <form class="mt-2 flex gap-2" @submit.prevent="addFeature">
            <UiInput v-model="feature" size="sm" aria-label="New feature highlight" placeholder="e.g. 1,200 past questions" class="flex-1" />
            <UiButton type="submit" variant="secondary" size="sm" :disabled="!feature.trim()">Add</UiButton>
          </form>
        </div>

        <UiField
          label="Privacy information"
          hint="Required if the app uses the network. Say what leaves the device and where it goes."
        >
          <UiTextarea
            :model-value="app.privacyPolicy"
            :rows="3"
            placeholder="e.g. Scores are sent to Afronet to build the leaderboard. Nothing else leaves your device."
            @update:model-value="type({ privacyPolicy: $event })"
          />
        </UiField>

        <UiField label="Support contact" hint="Shown to anyone who needs help with your app.">
          <UiInput
            :model-value="app.supportEmail"
            placeholder="you@students.afronet.net"
            @update:model-value="type({ supportEmail: $event })"
          />
        </UiField>
      </section>

      <aside class="lg:sticky lg:top-20 lg:self-start">
        <p class="mb-2 text-[12px] font-medium text-[#606863]">How the store will show it</p>
        <StudioListingPreview :app="app" />
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
import { categories } from '~/data/store'

definePageMeta({ layout: 'studio' })

const route = useRoute()

const { findDevApp, updateDevApp, updateDevAppSoon, flushDevApp, notify } = useStudio()

const app = computed(() => findDevApp(String(route.params.id || '')))

useHead({ title: computed(() => `Listing · ${app.value?.name ?? 'App'} · Afronet Studio`) })

const feature = ref('')

/** A deliberate action — a category, a feature added or removed. Saved straight away. */
const update = (patch) => updateDevApp(app.value.id, patch)

/** A field being typed into. The screen keeps up; the request waits for a pause. */
const type = (patch) => updateDevAppSoon(app.value.id, patch)

// Leaving the screen should not lose the last few characters.
onBeforeUnmount(() => {
  if (app.value) flushDevApp(app.value.id)
})

const complete = computed(
  () =>
    app.value.tagline.length >= 10 &&
    app.value.description.length >= 40 &&
    app.value.features.length >= 2,
)

const addFeature = () => {
  const value = feature.value.trim()
  if (!value) return
  update({ features: [...app.value.features, value] })
  feature.value = ''
}

const save = () => {
  update({ listingDone: true })
  notify('Listing saved.', 'success')
}
</script>
