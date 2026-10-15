<!-- app/pages/store/categories/[id].vue -->

<!--
  One category: a curated rail at the top when there is enough to curate, then the full
  list with the filters that matter most inside a category — offline, free, paid.
-->
<template>
  <div v-if="category">
    <NuxtLink to="/store/categories" class="text-[13px] font-medium text-[#606863] hover:text-[#121614]">
      ← All categories
    </NuxtLink>

    <div class="mt-3">
      <UiPageHeader :title="category.name" :description="category.blurb" />
    </div>

    <StoreAppRow
      v-if="apps.length > 2"
      :title="category.collections[0]"
      subtitle="Curated collection"
      :apps="topRated"
    />

    <div class="mt-8 flex flex-wrap items-center justify-between gap-3">
      <h2 class="text-[17px] font-semibold tracking-tight text-[#121614]">
        All {{ category.name.toLowerCase() }} apps
      </h2>
      <UiSegmentedControl v-model="filter" :options="filterOptions" size="sm" />
    </div>

    <div v-if="list.length" class="mt-3 grid gap-x-4 sm:grid-cols-2">
      <StoreAppCard v-for="a in list" :key="a.id" :app="a" />
    </div>
    <div v-else class="mt-4 rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-2">
      <UiStatePanel
        title="Nothing here yet"
        body="No apps match this filter. Student developers publish new apps every week."
      />
    </div>
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="Category not found" body="It may have been renamed.">
      <template #action><UiButton to="/store/categories">All categories</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { findCategory } from '~/data/store'

definePageMeta({ layout: 'store' })

const route = useRoute()

const { appsInCategory } = useAppLibrary()

const category = computed(() => findCategory(String(route.params.id || '')))
const apps = computed(() => (category.value ? appsInCategory(category.value.id) : []))

useHead({ title: computed(() => `${category.value?.name ?? 'Category'} · Afronet Apps`) })

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
  { value: 'small', label: 'Under 10 MB' },
]

const filter = ref('all')

const topRated = computed(() => [...apps.value].sort((a, b) => b.rating - a.rating).slice(0, 6))

const list = computed(() =>
  apps.value.filter((a) => {
    if (filter.value === 'free') return a.price === 0
    if (filter.value === 'paid') return a.price > 0
    if (filter.value === 'small') return a.downloadMB < 10
    return true
  }),
)
</script>
