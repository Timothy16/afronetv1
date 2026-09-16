<!-- app/components/Apps/Afrotainment.vue -->

<!-- Afrotainment. Rendered by /afrotainment, and inside a workspace window with `embedded`. -->
<template>
  <div :class="embedded ? 'pb-5' : ''">
    <section v-if="tab === 'home'" class="relative">
      <img
        :src="featured.poster"
        alt=""
        class="w-full object-cover"
        :class="embedded ? 'h-52' : 'h-[22rem] sm:h-[26rem]'"
      />
      <div class="absolute inset-0 bg-black/45" />
      <div class="absolute inset-x-0 bottom-0 p-5 sm:p-8">
        <p class="text-[11px] uppercase tracking-wide text-white/70">Featured · African cinema</p>
        <h1 class="mt-1 font-['Instrument_Serif',Georgia,serif] text-[30px] leading-none text-white sm:text-[40px]">
          {{ featured.name }}
        </h1>
        <p class="mt-2 max-w-xl text-[13px] leading-relaxed text-white/80">{{ featured.synopsis }}</p>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <UiButton size="sm" @click="detail = featured">
            <template #icon><i class="fa-solid fa-play text-[12px]" aria-hidden="true"></i></template>
            Play
          </UiButton>
          <UiButton size="sm" variant="secondary">
            <template #icon><i class="fa-solid fa-plus text-[12px]" aria-hidden="true"></i></template>
            Watchlist
          </UiButton>
          <span class="text-[11px] text-white/70">{{ featured.year }} · {{ featured.duration }} · {{ featured.country }}</span>
        </div>
      </div>
    </section>

    <div class="pt-5" :class="embedded ? 'px-5' : 'mx-auto max-w-6xl px-5'">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <UiSegmentedControl
          v-model="tab"
          :options="[
            { value: 'home', label: 'Watch' },
            { value: 'shorts', label: 'Shorts' },
            { value: 'upload', label: 'Create' },
          ]"
        />
        <UiBadge tone="gold">Streaming launches after V1</UiBadge>
      </div>

      <!-- Watch -->
      <div v-if="tab === 'home'" class="mt-6 space-y-8">
        <section v-for="r in rows" :key="r.id">
          <UiSectionHeading
            :title="r.label"
            :hint="r.id === 'r4' ? 'Cached on nearby Afronet nodes — download without internet' : ''"
          />
          <div class="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-2">
            <AfrotainmentPosterCard
              v-for="(t, i) in r.items.map((id) => titleById(id)).filter(Boolean)"
              :key="`${r.id}-${i}`"
              :title="t"
              @open="detail = $event"
            />
          </div>
        </section>
      </div>

      <!-- Shorts -->
      <div v-else-if="tab === 'shorts'" class="mt-6 flex justify-center">
        <div class="relative w-full max-w-sm overflow-hidden rounded-2xl border border-[#e4e4de] bg-black">
          <img :src="short.image" alt="" class="aspect-[9/16] w-full object-cover opacity-90" />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            <p class="text-[13px] font-medium text-white">{{ short.creator }}</p>
            <p class="mt-1 text-[13px] leading-snug text-white/85">{{ short.caption }}</p>
            <p class="mt-2 text-[11px] text-white/60">{{ short.music }}</p>
          </div>
          <div class="absolute bottom-24 right-3 flex flex-col items-center gap-4 text-white">
            <button v-for="a in shortActions" :key="a.icon" class="flex flex-col items-center gap-1">
              <i class="fa-solid text-[22px]" :class="a.icon" aria-hidden="true"></i>
              <span class="text-[10px]">{{ a.label }}</span>
            </button>
          </div>
          <div class="absolute right-3 top-3 flex gap-1">
            <UiIconButton label="Previous short" tone="overlay" @click="shortIndex = (shortIndex - 1 + shorts.length) % shorts.length">
              ↑
            </UiIconButton>
            <UiIconButton label="Next short" tone="overlay" @click="shortIndex = (shortIndex + 1) % shorts.length">
              ↓
            </UiIconButton>
          </div>
        </div>
      </div>

      <!-- Create -->
      <div v-else class="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <UiCard class="p-5">
          <div v-if="published" class="py-6 text-center">
            <i class="fa-solid fa-check text-[28px] text-[#0b5d3e]" aria-hidden="true"></i>
            <p class="mt-3 text-[15px] font-semibold text-[#121614]">Published to Afrotainment</p>
            <p class="mx-auto mt-1 max-w-sm text-[13px] text-[#606863]">
              Your video is available to nearby Afronet devices immediately and to the wider network when a gateway is
              reached.
            </p>
            <UiButton size="sm" class="mt-4" @click="published = false">Upload another</UiButton>
          </div>
          <template v-else>
            <div class="flex flex-col items-center rounded-2xl border border-dashed border-[#e4e4de] py-10">
              <i class="fa-solid fa-upload text-[22px] text-[#0b5d3e]" aria-hidden="true"></i>
              <p class="mt-3 text-[14px] text-[#121614]">Drop a video, or choose from device</p>
              <p class="mt-1 text-[12px] text-[#8f9792]">MP4 or MOV · up to 4 GB</p>
              <UiButton size="sm" variant="secondary" class="mt-4">Choose file</UiButton>
            </div>

            <div class="mt-5 space-y-3">
              <UiInput v-model="uploadTitle" placeholder="Title" />
              <UiTextarea :rows="4" placeholder="Description" />
              <div class="grid gap-3 sm:grid-cols-2">
                <UiInput placeholder="Category · Documentary" />
                <UiInput placeholder="Language · English, Hausa" />
              </div>
              <UiInput placeholder="Tags — solar, clinic, Jalingo" />
            </div>

            <div class="mt-4">
              <p class="mb-2 text-[12px] font-medium text-[#121614]">Audience</p>
              <div class="flex flex-wrap gap-2">
                <!-- The design marks "Public" as chosen and does not switch. -->
                <button
                  v-for="(a, i) in audiences"
                  :key="a"
                  class="rounded-full border px-3 py-1.5 text-[12px]"
                  :class="i === 0 ? 'border-[#0b5d3e] bg-[#eaf3ee] text-[#0b5d3e]' : 'border-[#e4e4de] text-[#606863]'"
                >
                  {{ a }}
                </button>
              </div>
            </div>

            <div class="mt-5">
              <p class="mb-1.5 flex justify-between text-[11px] text-[#606863]">
                <span>Uploading to Polytechnic Node</span>
                <span>64%</span>
              </p>
              <UiProgress :value="64" />
            </div>

            <UiButton class="mt-5" @click="published = true">Publish</UiButton>
          </template>
        </UiCard>

        <UiCard class="h-fit p-5">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-wand-magic-sparkles text-[14px] text-[#0b5d3e]" aria-hidden="true"></i>
            <p class="text-[13px] font-medium text-[#121614]">AfroIntel assistance</p>
          </div>
          <div class="mt-3 space-y-2">
            <button
              v-for="a in assists"
              :key="a"
              class="block w-full rounded-xl border border-[#e4e4de] px-3 py-2 text-left text-[12px] text-[#606863] transition-[border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#0b5d3e]/50 hover:text-[#121614]"
            >
              {{ a }}
            </button>
          </div>
          <p class="mt-3 text-[11px] leading-relaxed text-[#8f9792]">
            Runs on your installed model. Subtitles are generated on device, so unreleased footage never leaves it.
          </p>
        </UiCard>
      </div>
    </div>

    <UiModal
      :open="!!detail"
      :title="detail?.name ?? ''"
      :description="detail ? `${detail.kind} · ${detail.year} · ${detail.duration} · ${detail.country}` : ''"
      width="max-w-2xl"
      @close="detail = null"
    >
      <div v-if="detail">
        <img :src="detail.poster" alt="" class="h-48 w-full rounded-xl object-cover" />
        <p class="mt-4 text-[14px] leading-relaxed text-[#121614]">{{ detail.synopsis }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <span v-for="g in detail.genres" :key="g" class="rounded-full border border-[#e4e4de] px-2.5 py-1 text-[11px] text-[#606863]">
            {{ g }}
          </span>
        </div>
        <div v-if="detail.progress" class="mt-4">
          <UiProgress :value="detail.progress" tone="gold" />
          <p class="mt-1.5 text-[11px] text-[#8f9792]">{{ detail.progress }}% watched</p>
        </div>
        <div class="mt-5 flex flex-wrap gap-2">
          <UiButton>
            <template #icon><i class="fa-solid fa-play text-[14px]" aria-hidden="true"></i></template>
            Play
          </UiButton>
          <UiButton variant="secondary">
            <template #icon><i class="fa-solid fa-download text-[14px]" aria-hidden="true"></i></template>
            {{ detail.downloaded ? 'Downloaded' : 'Download for offline' }}
          </UiButton>
          <UiButton variant="ghost">
            <template #icon><i class="fa-solid fa-plus text-[14px]" aria-hidden="true"></i></template>
            Watchlist
          </UiButton>
        </div>
        <p class="mt-4 border-t border-[#e4e4de] pt-3 text-[11px] text-[#8f9792]">
          Available from Polytechnic Node, 1 hop away — no internet required for playback.
        </p>
      </div>
    </UiModal>
  </div>
</template>

<script setup>
import { featured, rows, shorts, titleById } from '~/data/media'

defineProps({
  embedded: { type: Boolean, default: false },
})

// home | shorts | upload
const tab = ref('home')
const detail = ref(null)
const shortIndex = ref(0)
const published = ref(false)
const uploadTitle = ref('Panel up in 9 minutes')

const short = computed(() => shorts[shortIndex.value])

const shortActions = computed(() => [
  { icon: 'fa-heart', label: short.value.likes },
  { icon: 'fa-comment', label: short.value.comments },
  { icon: 'fa-bookmark', label: short.value.saves },
  { icon: 'fa-share-nodes', label: 'Share' },
])

const audiences = ['Public', 'Community only', 'Private']

const assists = [
  'Generate title',
  'Write description',
  'Generate subtitles',
  'Translate subtitles to Hausa',
  'Create thumbnail',
]
</script>
