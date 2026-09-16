<!-- app/pages/social/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="Social layer"
      title="AfroSocial"
      description="People, communities, creators and institutions across the continent — one identity, no second account."
    />

    <div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
      <div class="space-y-4">
        <UiCard class="p-4">
          <div class="flex items-center gap-3">
            <UiAvatar :src="me.avatar" :name="me.name" :size="38" />
            <input
              placeholder="Share something with Africa"
              aria-label="Create a post"
              class="h-10 flex-1 rounded-full border border-[#e4e4de] bg-[#ffffff] px-4 text-[13px] text-[#121614] placeholder:text-[#8f9792] focus:border-[#0b5d3e] focus:outline-none"
            />
          </div>
          <div class="mt-3 flex flex-wrap gap-1">
            <button
              v-for="a in composeActions"
              :key="a.label"
              class="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4] hover:text-[#121614]"
            >
              <i class="fa-solid text-[12px]" :class="a.icon" aria-hidden="true"></i>
              {{ a.label }}
            </button>
          </div>
        </UiCard>

        <UiCard v-for="p in feed" :key="p.id" class="overflow-hidden">
          <div class="flex items-start gap-3 p-4">
            <UiAvatar :src="p.avatar" :name="p.author" :size="40" />
            <div class="min-w-0 flex-1">
              <p class="text-[14px] font-medium text-[#121614]">{{ p.author }}</p>
              <p class="text-[11px] text-[#8f9792]">{{ p.role }} · {{ p.time }}</p>
            </div>
            <UiBadge v-if="p.community" tone="brand">{{ p.community }}</UiBadge>
          </div>

          <p class="px-4 pb-3 text-[14px] leading-relaxed text-[#121614]">{{ p.body }}</p>

          <img v-if="p.image" :src="p.image" alt="" class="max-h-[26rem] w-full object-cover" />

          <div v-if="p.poll" class="space-y-2.5 px-4 pb-3">
            <button v-for="o in p.poll" :key="o.option" class="block w-full text-left">
              <span class="flex justify-between text-[12px] text-[#121614]">
                {{ o.option }}
                <span class="text-[#606863]">{{ o.pct }}%</span>
              </span>
              <UiProgress :value="o.pct" class="mt-1" />
            </button>
            <p class="text-[11px] text-[#8f9792]">2,481 votes · closes in 2 days</p>
          </div>

          <div class="flex items-center gap-1 border-t border-[#e4e4de] px-2 py-1.5">
            <button
              class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
              :class="liked.includes(p.id) ? 'text-[#0b5d3e]' : 'text-[#606863]'"
              @click="toggleLike(p.id)"
            >
              <i class="fa-solid fa-thumbs-up text-[14px]" aria-hidden="true"></i>
              {{ p.likes + (liked.includes(p.id) ? 1 : 0) }}
            </button>
            <button
              v-for="a in postActions(p)"
              :key="a.icon"
              class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] text-[#606863] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
            >
              <i class="fa-solid text-[14px]" :class="a.icon" aria-hidden="true"></i>
              {{ a.label }}
            </button>
          </div>
        </UiCard>
      </div>

      <aside class="space-y-5">
        <UiCard class="p-5">
          <UiSectionHeading title="Communities" />
          <div class="mt-3 space-y-3">
            <div v-for="c in communities" :key="c.id" class="flex items-center justify-between gap-3">
              <div class="min-w-0">
                <p class="truncate text-[13px] text-[#121614]">{{ c.name }}</p>
                <p class="text-[11px] text-[#8f9792]">{{ c.members }} members</p>
              </div>
              <UiBadge v-if="c.active" tone="brand">Active</UiBadge>
            </div>
          </div>
        </UiCard>

        <UiCard class="p-5">
          <UiSectionHeading title="Professional network" hint="Work, skills, opportunities" />
          <p class="mt-2 text-[13px] leading-relaxed text-[#606863]">
            Your African ID already carries your verified profession and education. Publish it once.
          </p>
          <!-- A button that navigates, rather than the design's button nested inside a link. -->
          <UiButton variant="secondary" size="sm" class="mt-3" @click="go('/professional')">
            Open professional profile
          </UiButton>
        </UiCard>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { communities, feed } from '~/data/social'
import { me } from '~/data/people'

useHead({ title: 'AfroSocial — Afronet' })

const liked = ref([])

const composeActions = [
  { label: 'Photo', icon: 'fa-image' },
  { label: 'Document', icon: 'fa-file-lines' },
  { label: 'Poll', icon: 'fa-square-poll-vertical' },
  { label: 'Event', icon: 'fa-calendar' },
]

const postActions = (p) => [
  { label: `${p.comments}`, icon: 'fa-comment' },
  { label: `${p.reposts}`, icon: 'fa-retweet' },
  { label: 'Share', icon: 'fa-share-from-square' },
]

const toggleLike = (id) => {
  liked.value = liked.value.includes(id) ? liked.value.filter((x) => x !== id) : [...liked.value, id]
}

const go = (path) => navigateTo(path)
</script>
