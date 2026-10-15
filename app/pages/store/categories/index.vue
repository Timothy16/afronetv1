<!-- app/pages/store/categories/index.vue -->

<!-- All categories, with a live count of what is actually published in each. -->
<template>
  <div>
    <UiPageHeader title="Categories" description="Browse by what you need to get done." />

    <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="c in categories"
        :key="c.id"
        :to="`/store/categories/${c.id}`"
        class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5 transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/40"
      >
        <StoreAppIcon :icon="c.icon" tone="ink" size="sm" />
        <p class="mt-4 text-[15px] font-semibold text-[#121614]">{{ c.name }}</p>
        <p class="mt-0.5 text-[13px] leading-relaxed text-[#606863]">{{ c.blurb }}</p>
        <p class="mt-3 text-[12px] font-medium text-[#8f9792]">
          {{ count(c.id) }} {{ count(c.id) === 1 ? 'app' : 'apps' }}
        </p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup>
import { categories } from '~/data/store'

definePageMeta({ layout: 'store' })
useHead({ title: 'Categories · Afronet Apps' })

const { appsInCategory } = useAppLibrary()

const count = (id) => appsInCategory(id).length
</script>
