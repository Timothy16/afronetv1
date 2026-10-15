<!-- app/pages/store/search.vue -->

<!--
  Discover: one search box, filters, and a sort. Search matches on what an app does as
  well as what it is called, and when nothing matches it tries one spelling correction
  against the catalogue's own words before giving up — people search for "flashcrds" and
  "offline map" far more often than for an app's exact name.

  The filter chips arrive as query parameters, so every rail and chip on the home page can
  deep-link straight into a filtered list.
-->
<template>
  <div>
    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">Discover</h1>
    <p v-if="!online" class="mt-1 text-[13px] text-[#b07f15]">
      Showing the cached catalogue. Details are viewable; downloads resume when you reconnect.
    </p>

    <form role="search" class="relative mt-4" @submit.prevent>
      <i
        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
        aria-hidden="true"
      ></i>
      <UiInput
        v-model="q"
        size="lg"
        aria-label="Search apps by name or what they do"
        placeholder="Search by name, or by what an app does"
        class="pl-11 pr-11"
      />
      <button
        v-if="q"
        type="button"
        aria-label="Clear search"
        class="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[#8f9792] hover:text-[#121614]"
        @click="q = ''"
      >
        <i class="fa-solid fa-xmark text-[13px]" aria-hidden="true"></i>
      </button>
    </form>

    <div class="mt-6 grid gap-8 lg:grid-cols-[230px_1fr]">
      <aside class="hidden lg:block">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[13px] font-semibold text-[#121614]">Filters</p>
          <button v-if="activeCount" class="text-[12px] font-medium text-[#0b5d3e]" @click="reset">Reset</button>
        </div>
        <StoreSearchFilters v-model="filters" />
      </aside>

      <section>
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p class="text-[13px] text-[#606863]" aria-live="polite">
            <template v-if="correctedTo">
              No results for “{{ q }}”. Showing results for
              <strong class="text-[#121614]">“{{ correctedTo }}”</strong>
            </template>
            <template v-else>
              <strong class="text-[#121614]">{{ results.length }}</strong> apps<template v-if="q"> for “{{ q }}”</template>
            </template>
          </p>

          <div class="flex items-center gap-2">
            <UiButton variant="secondary" size="sm" class="lg:hidden" @click="sheet = true">
              <template #icon><i class="fa-solid fa-sliders text-[11px]" aria-hidden="true"></i></template>
              Filters{{ activeCount ? ` · ${activeCount}` : '' }}
            </UiButton>
            <UiSelect v-model="sort" :options="sorts" size="sm" aria-label="Sort by" class="w-[170px]" />
          </div>
        </div>

        <div v-if="results.length" class="grid gap-x-4 sm:grid-cols-2">
          <StoreAppCard v-for="a in results" :key="a.id" :app="a" />
        </div>

        <div v-else class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-2">
          <UiStatePanel
            :title="q ? `No apps match “${q}”` : 'No apps match these filters'"
            body="Try fewer filters, a shorter word, or search by what the app does — like “flashcards” or “budget”."
          >
            <template #icon><i class="fa-solid fa-magnifying-glass text-[16px]" aria-hidden="true"></i></template>
            <template #action>
              <div class="flex flex-wrap items-center justify-center gap-2">
                <UiButton v-if="activeCount" variant="secondary" size="sm" @click="reset">Clear filters</UiButton>
                <UiButton v-for="s in suggestions" :key="s" variant="ghost" size="sm" @click="trySuggestion(s)">
                  {{ s }}
                </UiButton>
              </div>
            </template>
          </UiStatePanel>
        </div>
      </section>
    </div>

    <UiModal :open="sheet" title="Filters" @close="sheet = false">
      <StoreSearchFilters v-model="filters" />
      <div class="mt-6 flex flex-wrap justify-end gap-2">
        <UiButton variant="ghost" @click="reset">Reset</UiButton>
        <UiButton @click="sheet = false">Show {{ results.length }} apps</UiButton>
      </div>
    </UiModal>
  </div>
</template>

<script setup>
import { searchApps } from '~/data/store'

definePageMeta({ layout: 'store' })
useHead({ title: 'Discover · Afronet Apps' })

const { online, liveApps } = useAppLibrary()
const route = useRoute()

const sorts = [
  { id: 'relevance', name: 'Relevance' },
  { id: 'popular', name: 'Most installed' },
  { id: 'rating', name: 'Highest rated' },
  { id: 'newest', name: 'Recently updated' },
  { id: 'smallest', name: 'Smallest download' },
]

const blank = { price: 'all', size: 0, rating: 0, recent: false }

// Seeded from the address, so a chip on the home page lands here already filtered.
const q = ref(String(route.query.q ?? ''))
const sort = ref(String(route.query.sort ?? 'relevance'))
const filters = ref({
  ...blank,
  price: String(route.query.price ?? 'all'),
  size: Number(route.query.size ?? 0),
})
const sheet = ref(false)

const found = computed(() => searchApps(liveApps.value, q.value))
const correctedTo = computed(() => found.value.correctedTo)

const results = computed(() => {
  const f = filters.value
  const list = found.value.results.filter(
    (a) =>
      (f.price === 'all' || (f.price === 'free' ? a.price === 0 : a.price > 0)) &&
      (!f.size || a.downloadMB < f.size) &&
      a.rating >= f.rating &&
      (!f.recent || a.updatedAt >= '2026-09-12'),
  )

  const sorters = {
    relevance: () => 0,
    popular: (x, y) => y.installs - x.installs,
    rating: (x, y) => y.rating - x.rating,
    newest: (x, y) => (y.updatedAt > x.updatedAt ? 1 : -1),
    smallest: (x, y) => x.downloadMB - y.downloadMB,
  }
  return [...list].sort(sorters[sort.value] ?? sorters.relevance)
})

const activeCount = computed(() => {
  const f = filters.value
  return (
    (f.price !== 'all' ? 1 : 0) +
    (f.size ? 1 : 0) +
    (f.rating ? 1 : 0) +
    (f.recent ? 1 : 0)
  )
})

const reset = () => {
  filters.value = { ...blank }
}

// Something to press when a search comes back empty, rather than a dead end.
const suggestions = ['quiz', 'map', 'budget']

const trySuggestion = (term) => {
  q.value = term
  reset()
}
</script>
