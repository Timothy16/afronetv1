<!-- app/components/Shell/AppsLauncher.vue -->

<template>
  <UiModal
    :open="open"
    title="Afronet apps"
    description="One identity, one network, every service."
    width="max-w-3xl"
    @close="emit('close')"
  >
    <div class="relative mb-6">
      <i
        class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
        aria-hidden="true"
      ></i>
      <UiInput ref="searchEl" v-model="q" placeholder="Search apps" class="pl-10" />
    </div>

    <div class="space-y-7">
      <section v-for="g in grouped" :key="g.category">
        <h3 class="mb-3 text-[11px] font-medium uppercase tracking-wide text-[#8f9792]">{{ g.category }}</h3>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <div v-for="a in g.items" :key="a.id" class="group relative">
            <button
              class="flex w-full items-start gap-3 rounded-xl border border-transparent p-3 text-left transition-[background-color,border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-[#e4e4de] hover:bg-[#f7f7f4]"
              @click="go(a.route)"
            >
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                :class="a.phase === 'v1' ? 'bg-[#eaf3ee] text-[#0b5d3e]' : 'bg-[#f7f7f4] text-[#606863]'"
              >
                <ShellAppIcon :name="a.icon" />
              </span>
              <span class="min-w-0">
                <span class="flex items-center gap-2">
                  <span class="truncate text-[13px] font-medium text-[#121614]">{{ a.name }}</span>
                  <UiComingSoon v-if="a.phase !== 'v1'" />
                </span>
                <span class="mt-0.5 block text-[12px] leading-snug text-[#606863]">{{ a.blurb }}</span>
              </span>
            </button>
            <button
              :aria-label="pinned.includes(a.id) ? `Unpin ${a.name}` : `Pin ${a.name}`"
              class="absolute right-2 top-2 rounded-md p-1 transition-opacity duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
              :class="pinned.includes(a.id) ? 'text-[#0b5d3e] opacity-100' : 'text-[#8f9792] opacity-0 group-hover:opacity-100'"
              @click="togglePin(a.id)"
            >
              <i class="fa-solid fa-thumbtack text-[12px]" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </section>
    </div>
  </UiModal>
</template>

<script setup>
import { appCategories, apps } from '~/data/apps'

const props = defineProps({
  open: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

const { pinned, togglePin } = useAfronet()
const q = ref('')
const searchEl = ref(null)

const grouped = computed(() => {
  const filtered = apps.filter((a) => a.name.toLowerCase().includes(q.value.toLowerCase()))
  return appCategories
    .map((c) => ({ category: c, items: filtered.filter((a) => a.category === c) }))
    .filter((g) => g.items.length > 0)
})

// The design autofocused the search field. `autofocus` is unreliable on
// elements inserted after page load, so focus it when the dialog opens.
watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await nextTick()
    searchEl.value?.$el?.focus()
  },
)

const go = (route) => {
  navigateTo(route)
  emit('close')
}
</script>
