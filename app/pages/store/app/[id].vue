<!-- app/pages/store/app/[id].vue -->

<!--
  One app's listing. The main column sells it; the sidebar is the part the developer guide
  cares about — what works without internet, what it will cost in space, what it can reach
  on this device, and what changed in the last version.

  The single button at the top carries the whole state machine: unavailable, downloading,
  update, open, buy, or get. There is never more than one thing to press.
-->
<template>
  <div v-if="app">
    <button class="mb-4 text-[13px] font-medium text-[#606863] hover:text-[#121614]" @click="back">← Back</button>

    <div v-if="suspended" class="mb-5 flex items-start gap-3 rounded-2xl bg-[#b22c26]/10 p-4 text-[#b22c26]">
      <i class="fa-solid fa-shield-halved mt-0.5 text-[15px]" aria-hidden="true"></i>
      <p class="text-[13.5px] leading-relaxed">
        <strong>This app has been removed from the store while it is reviewed.</strong> New downloads are paused. If
        you already installed it, it keeps working; you’ll be told if it must be removed.
      </p>
    </div>

    <div class="grid gap-8 lg:grid-cols-[1fr_340px]">
      <div class="min-w-0">
        <header class="flex flex-col gap-5 sm:flex-row sm:items-start">
          <StoreAppIcon :icon="app.icon" :tone="app.tone" size="xl" :muted="suspended" />
          <div class="min-w-0 flex-1">
            <h1 class="font-['Instrument_Serif',Georgia,serif] text-[30px] leading-tight text-[#121614]">
              {{ app.name }}
            </h1>
            <p class="mt-0.5 text-[14.5px] text-[#606863]">{{ app.tagline }}</p>
            <NuxtLink
              :to="`/store/search?q=${encodeURIComponent(app.creatorName)}`"
              class="mt-2 inline-flex items-center gap-1.5 text-[13.5px] font-medium text-[#0b5d3e] hover:underline"
            >
              {{ app.creatorName }}
              <span v-if="app.creatorSchool" class="font-normal text-[#606863]">· {{ app.creatorSchool }}</span>
            </NuxtLink>

            <div class="mt-4 flex flex-wrap items-center gap-2">
              <UiButton v-if="suspended" size="lg" disabled>Unavailable</UiButton>
              <UiButton v-else-if="task" size="lg" variant="secondary" @click="install = true">
                {{ task.status === 'failed' ? 'Download failed — view' : `Downloading ${Math.round(task.progress)}%` }}
              </UiButton>
              <UiButton v-else-if="inst && updateReady" size="lg" @click="install = true">
                Update to {{ app.version }}
              </UiButton>
              <UiButton v-else-if="inst" size="lg" :disabled="!online" @click="navigateTo(`/run/${app.id}`)">Open</UiButton>
              <UiButton v-else-if="!entitled" size="lg" :disabled="!online" @click="buy = true">
                Buy · {{ formatNaira(app.price) }}
              </UiButton>
              <UiButton v-else size="lg" :disabled="!online" @click="install = true">
                {{ app.price > 0 ? 'Download (purchased)' : 'Get · Free' }}
              </UiButton>

              <UiButton variant="secondary" size="lg" :aria-pressed="isSaved" @click="toggleSaved(app.id)">
                <template #icon>
                  <i class="fa-solid fa-bookmark text-[12px]" :class="isSaved ? 'text-[#0b5d3e]' : ''" aria-hidden="true"></i>
                </template>
                {{ isSaved ? 'Saved' : 'Save' }}
              </UiButton>

              <UiButton variant="ghost" size="lg" @click="share">
                <template #icon><i class="fa-solid fa-share-nodes text-[12px]" aria-hidden="true"></i></template>
                Share
              </UiButton>
            </div>

            <p v-if="app.price > 0 && !entitled" class="mt-2 text-[12.5px] text-[#606863]">
              One-time purchase linked to your account. Restore on any device.
            </p>
            <p v-if="app.price > 0 && entitled && !inst" class="mt-2 flex items-center gap-1.5 text-[12.5px] font-medium text-[#0b5d3e]">
              <i class="fa-solid fa-circle-check text-[11px]" aria-hidden="true"></i>
              You own this app
            </p>
            <p v-if="!online && !inst" class="mt-2 flex items-center gap-1.5 text-[12.5px] text-[#b07f15]">
              <i class="fa-solid fa-link-slash text-[11px]" aria-hidden="true"></i>
              Connect to download or buy.
            </p>
          </div>
        </header>

        <dl class="no-scrollbar mt-6 flex divide-x divide-[#e4e4de] overflow-x-auto rounded-2xl border border-[#e4e4de] bg-[#ffffff]">
          <div v-for="f in facts" :key="f.k" class="min-w-[120px] flex-1 px-4 py-3 text-center">
            <dt class="text-[11.5px] text-[#606863]">{{ f.k }}</dt>
            <dd class="mt-0.5 text-[16px] font-semibold text-[#121614]">{{ f.v }}</dd>
            <dd class="truncate text-[11.5px] text-[#8f9792]">{{ f.s }}</dd>
          </div>
        </dl>

        <section class="mt-8">
          <h2 class="text-[17px] font-semibold text-[#121614]">About this app</h2>
          <p class="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-[#606863]">{{ app.description }}</p>
          <ul class="mt-4 grid gap-2 sm:grid-cols-2">
            <li v-for="f in app.features" :key="f" class="flex items-center gap-2 text-[14px] text-[#121614]">
              <i class="fa-solid fa-circle-check text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
              {{ f }}
            </li>
          </ul>
        </section>

        <section class="mt-10">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h2 class="text-[17px] font-semibold text-[#121614]">Ratings &amp; reviews</h2>
            <UiButton v-if="inst || entitled" variant="secondary" size="sm" @click="openReview">
              <template #icon>
                <i class="fa-solid text-[11px]" :class="mine ? 'fa-pen' : 'fa-star'" aria-hidden="true"></i>
              </template>
              {{ mine ? 'Edit your review' : 'Write a review' }}
            </UiButton>
            <span v-else class="text-[12.5px] text-[#606863]">Install to review</span>
          </div>

          <ul v-if="appReviews.length" class="mt-4 divide-y divide-[#e4e4de] rounded-2xl border border-[#e4e4de] bg-[#ffffff]">
            <li v-for="r in appReviews" :key="r.id" class="p-4">
              <div class="flex flex-wrap items-center gap-2 text-[13px]">
                <StoreStars :value="r.rating" />
                <span class="font-medium text-[#121614]">{{ r.author }}</span>
                <UiBadge v-if="r.verified" tone="brand">
                  <i class="fa-solid fa-circle-check text-[9px]" aria-hidden="true"></i>
                  Verified purchase
                </UiBadge>
                <span class="ml-auto text-[12px] text-[#8f9792]">{{ formatDate(r.date) }}</span>
              </div>
              <p class="mt-2 text-[14px] leading-relaxed text-[#121614]">{{ r.body }}</p>
              <div v-if="r.reply" class="mt-3 rounded-xl bg-[#f7f7f4] p-3 text-[13px]">
                <p class="font-medium text-[#121614]">Developer response</p>
                <p class="mt-0.5 text-[#606863]">{{ r.reply }}</p>
              </div>
            </li>
          </ul>
          <p v-else class="mt-3 rounded-2xl border border-dashed border-[#e4e4de] p-5 text-[13.5px] text-[#606863]">
            No reviews yet. Be the first after you install.
          </p>
        </section>
      </div>

      <aside class="space-y-4">
        <section class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
          <h2 class="text-[15px] font-semibold text-[#121614]">Where it runs</h2>
          <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
            Inside Afronet, in a sandbox of its own — not installed on your phone’s home screen. Opening it, updating
            it and removing it all happen here.
          </p>
          <p class="mt-3 flex items-start gap-1.5 text-[12.5px] text-[#606863]">
            <i class="fa-solid fa-circle-info mt-0.5 shrink-0 text-[11px]" aria-hidden="true"></i>
            {{ storeCopy.needsConnection }}
          </p>
        </section>

        <section class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
          <h2 class="text-[15px] font-semibold text-[#121614]">Size &amp; storage</h2>
          <dl class="mt-3 space-y-2 text-[13px]">
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Download</dt>
              <dd class="font-semibold text-[#121614]">{{ formatMB(app.downloadMB) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Installed (estimated)</dt>
              <dd class="font-semibold text-[#121614]">{{ formatMB(app.installedMB) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Extra data</dt>
              <dd class="text-right font-medium text-[#121614]">{{ app.extraData || 'None expected' }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-[11.5px] text-[#8f9792]">Saved data and caches may need more space over time.</p>
        </section>

        <section class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
          <h2 class="text-[15px] font-semibold text-[#121614]">Permissions</h2>
          <ul v-if="app.permissions.length" class="mt-3 space-y-3">
            <li v-for="perm in app.permissions" :key="perm.id" class="text-[13px]">
              <p class="font-medium text-[#121614]">{{ perm.label }}</p>
              <p class="text-[#606863]">{{ perm.reason }}</p>
            </li>
          </ul>
          <p v-else class="mt-2 text-[13px] text-[#606863]">This app requests no permissions.</p>

          <h3 class="mt-5 flex items-center gap-1.5 text-[13px] font-semibold text-[#121614]">
            <i class="fa-solid fa-shield-halved text-[11px] text-[#0b5d3e]" aria-hidden="true"></i>
            Privacy
          </h3>
          <p class="mt-1 text-[13px] text-[#606863]">
            {{
              app.dataCollected.length
                ? `Collects: ${app.dataCollected.join('; ')}.`
                : 'The developer declares this app collects no personal data.'
            }}
          </p>
          <p class="mt-1 text-[12px] text-[#8f9792]">{{ storeCopy.sandboxNote }}</p>
          <p v-if="app.externalDeps.length" class="mt-2 text-[12.5px] text-[#606863]">
            <strong class="text-[#121614]">External services:</strong> {{ app.externalDeps.join(', ') }}
          </p>
        </section>

        <section v-if="app.changelog.length" class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
          <h2 class="text-[15px] font-semibold text-[#121614]">What’s new</h2>
          <ul class="mt-3 space-y-3">
            <li v-for="c in app.changelog.slice(0, 3)" :key="c.version" class="text-[13px]">
              <p class="font-medium text-[#121614]">
                {{ c.version }}
                <span class="font-normal text-[#8f9792]">· {{ formatDate(c.date) }}</span>
              </p>
              <p class="text-[#606863]">{{ c.notes }}</p>
            </li>
          </ul>
        </section>

        <div class="px-1">
          <StoreDemoTag />
        </div>
      </aside>
    </div>

    <StoreInstallDialog :app-id="app.id" :open="install" @close="install = false" />
    <StorePurchaseDialog :app-id="app.id" :open="buy" @close="buy = false" @purchased="install = true" />
    <StoreReviewDialog
      :app-id="app.id"
      :open="review"
      :existing="editing"
      @close="review = false"
    />
  </div>

  <div v-else>
    <UiStatePanel kind="error" title="App not found" body="This app may have been removed, or the link is wrong.">
      <template #action><UiButton to="/store">Back to store</UiButton></template>
    </UiStatePanel>
  </div>
</template>

<script setup>
import { compact, findCategory, formatDate, formatMB, formatNaira, storeCopy } from '~/data/store'

definePageMeta({ layout: 'store' })

const route = useRoute()
const router = useRouter()

const { online, saved, toggleSaved, getApp, getInstalled, getDownload, hasEntitlement, hasUpdate, reviewsFor, loadReviews, removeReview, notify } =
  useAppLibrary()

const app = computed(() => getApp(String(route.params.id || '')))

useHead({ title: computed(() => `${app.value?.name ?? 'App'} · Afronet Apps`) })

const install = ref(false)
const buy = ref(false)
const review = ref(false)
const editing = ref(null)

const inst = computed(() => getInstalled(app.value.id))
const task = computed(() => getDownload(app.value.id))
const entitled = computed(() => hasEntitlement(app.value.id))
const updateReady = computed(() => hasUpdate(app.value.id))
const suspended = computed(() => app.value.status === 'suspended')
const isSaved = computed(() => saved.value.includes(app.value.id))
const appReviews = computed(() => reviewsFor(app.value.id))

// Fetched when the page opens, and again if the person moves to another app without leaving
// the route.
onMounted(() => loadReviews(app.value.id))
watch(() => app.value?.id, (id) => { if (id) loadReviews(id) })
const mine = computed(() => appReviews.value.find((r) => r.mine))

const facts = computed(() => {
  const cat = findCategory(app.value.category)
  return [
    {
      k: 'Rating',
      v: app.value.ratingCount ? app.value.rating.toFixed(1) : 'New',
      s: app.value.ratingCount ? `${compact(app.value.ratingCount)} ratings` : 'No ratings yet',
    },
    { k: 'Download', v: formatMB(app.value.downloadMB), s: `${formatMB(app.value.installedMB)} installed` },
    { k: 'Installs', v: compact(app.value.installs), s: 'all time' },
    { k: 'Version', v: app.value.version, s: `Updated ${formatDate(app.value.updatedAt)}` },
    { k: 'Category', v: cat?.name.split(' ')[0] ?? '', s: cat?.name ?? '' },
  ]
})

const openReview = () => {
  editing.value = mine.value ?? null
  review.value = true
}

// Back to wherever this listing was opened from, falling back to the store for a cold
// deep link where there is no history to go back to.
const back = () => {
  if (import.meta.client && window.history.length > 1) router.back()
  else navigateTo('/store')
}

/**
 * Shares the address this page is actually at.
 *
 * It used to copy `apps.afronet.net/a/<id>` — a domain that does not exist, on a path that is
 * not a route. Anyone who pasted it got nothing. The link is now built from where the person
 * is standing, so it works wherever Afronet is running, including localhost.
 */
const share = async () => {
  if (!import.meta.client) return

  const url = `${window.location.origin}/store/app/${app.value.id}`

  // On a phone this opens the system share sheet, which is what someone actually wants.
  if (navigator.share) {
    try {
      await navigator.share({ title: app.value.name, text: app.value.tagline, url })
      return
    } catch {
      // Dismissed, or not permitted here. Fall through to copying.
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    notify('Link copied', 'success')
  } catch {
    // Clipboard access needs a secure context, which a phone on a local network may not be.
    notify(url)
  }
}
</script>
