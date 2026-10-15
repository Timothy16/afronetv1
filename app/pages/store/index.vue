<!-- app/pages/store/index.vue -->

<!--
  The store's front page. Rails rather than one long grid, because what people are
  choosing between is rarely "all apps" — it is "something small", "something free",
  "something other students are using".

  There is no separate screen for having no connection: the header says so once, and the
  buttons that need the server disable themselves.
-->
<template>
  <!-- The catalogue comes from the server, so it can genuinely be empty or unreachable. -->
  <div v-if="!featured" class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-2">
    <UiStatePanel
      :kind="catalogueLoaded ? 'empty' : 'error'"
      :title="catalogueLoaded ? 'No apps published yet' : 'The store could not be reached'"
      :body="
        catalogueLoaded
          ? 'Nothing has been published to the Afronet App Store yet. Build the first one.'
          : 'We could not load the catalogue. Check your connection and try again.'
      "
    >
      <template #action>
        <UiButton v-if="catalogueLoaded" to="/studio/create">Create an app</UiButton>
        <UiButton v-else @click="loadCatalogue(true)">Try again</UiButton>
      </template>
    </UiStatePanel>
  </div>

  <div v-else>
    <div class="no-scrollbar -mx-1 mb-5 flex gap-2 overflow-x-auto px-1">
      <NuxtLink
        v-for="c in chips"
        :key="c.label"
        :to="c.to"
        class="whitespace-nowrap rounded-full border border-[#e4e4de] bg-[#ffffff] px-3.5 py-1.5 text-[13px] font-medium text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/40"
      >
        {{ c.label }}
      </NuxtLink>
    </div>

    <section class="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div class="relative overflow-hidden rounded-3xl bg-[#121614] p-6 text-[#ffffff] sm:p-8">
        <div class="relative z-10 max-w-md">
          <p class="text-[12.5px] font-medium text-[#ffffff]/50">Featured · made by a student</p>
          <div class="mt-4 flex items-center gap-4">
            <StoreAppIcon :icon="featured.icon" :tone="featured.tone" size="xl" />
            <div>
              <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight">{{ featured.name }}</h1>
              <p class="text-[13.5px] text-[#ffffff]/60">by {{ featured.creatorName }} · {{ featured.creatorSchool }}</p>
            </div>
          </div>
          <p class="mt-4 text-[15px] leading-relaxed text-[#ffffff]/80">
            {{ featured.tagline }}. Download it into Afronet and open it here — it never lands on your phone’s home
            screen, and you can remove it whenever you need the space.
          </p>
          <div class="mt-4 flex flex-wrap items-center gap-2 text-[12.5px] text-[#ffffff]/60">
            <span>{{ formatMB(featured.downloadMB) }} download</span>
            <span>·</span>
            <span>{{ compact(featured.installs) }} installs</span>
            <span>·</span>
            <StorePriceTag :price="featured.price" on-dark />
          </div>
          <div class="mt-6">
            <UiButton :to="`/store/app/${featured.id}`" variant="secondary">View app</UiButton>
          </div>
        </div>

      </div>

      <aside class="rounded-3xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <div class="flex items-center justify-between">
          <h2 class="text-[15px] font-semibold text-[#121614]">Browse categories</h2>
          <NuxtLink to="/store/categories" class="text-[12.5px] font-medium text-[#0b5d3e] hover:underline">All</NuxtLink>
        </div>
        <ul class="mt-2">
          <li v-for="c in categories" :key="c.id">
            <NuxtLink
              :to="`/store/categories/${c.id}`"
              class="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 text-[13.5px] font-medium text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            >
              <StoreAppIcon :icon="c.icon" tone="ink" size="xs" />
              <span class="flex-1">{{ c.name }}</span>
              <span class="text-[12px] text-[#8f9792]">{{ countIn(c.id) }}</span>
              <i class="fa-solid fa-chevron-right text-[10px] text-[#8f9792]" aria-hidden="true"></i>
            </NuxtLink>
          </li>
        </ul>
      </aside>
    </section>

    <div class="mt-3 flex flex-wrap items-center gap-2 px-1">
      <StoreDemoTag />
      <span class="text-[12px] text-[#8f9792]">{{ storeCopy.demoNote }}</span>
    </div>

    <StoreAppRow title="Trending" :apps="trending" see-all="/store/search?sort=popular" />
    <StoreAppRow title="Recommended for you" subtitle="Based on your installed study apps" :apps="recommended" />
    <StoreAppRow title="New releases" :apps="newApps" see-all="/store/search?sort=newest" />
    <StoreAppRow title="Popular educational tools" :apps="education" see-all="/store/categories/education" />
    <StoreAppRow title="Made by students" subtitle="Built in Afronet Studio" :apps="student" />
    <StoreAppRow title="Free" :apps="free" see-all="/store/search?price=free" />
    <StoreAppRow
      title="Paid"
      subtitle="One-time purchase · restore on any device"
      :apps="paid"
      see-all="/store/search?price=paid"
    />
    <StoreAppRow title="Recently updated" :apps="updatedRecently" see-all="/store/search?sort=newest" />
  </div>
</template>

<script setup>
import { categories, compact, formatMB, storeCopy } from '~/data/store'

definePageMeta({ layout: 'store' })
useHead({ title: 'Afronet Apps' })

const { liveApps, appsInCategory, appsInCollection, recentApps, catalogueLoaded, loadCatalogue } = useAppLibrary()

const featured = computed(() => appsInCollection('featured')[0] ?? liveApps.value[0])

const chips = [
  { label: 'Free', to: '/store/search?price=free' },
  { label: 'Paid', to: '/store/search?price=paid' },
  { label: 'Under 10 MB', to: '/store/search?size=10' },
  ...categories.slice(0, 5).map((c) => ({ label: c.name, to: `/store/categories/${c.id}` })),
]

const countIn = (id) => appsInCategory(id).length

const trending = computed(() => appsInCollection('trending'))
const recommended = computed(() => appsInCollection('recommended'))
const newApps = computed(() => appsInCollection('new'))
const student = computed(() => appsInCollection('student'))
const education = computed(() => appsInCategory('education'))
const free = computed(() => liveApps.value.filter((a) => a.price === 0))
const paid = computed(() => liveApps.value.filter((a) => a.price > 0))
const updatedRecently = computed(() => recentApps())
</script>
