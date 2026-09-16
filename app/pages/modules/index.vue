<!-- app/pages/modules/index.vue -->

<template>
  <div class="mx-auto w-full max-w-6xl px-5 py-8">
    <UiPageHeader
      eyebrow="Intelligence layer"
      title="AI Module Store"
      description="AfroIntel is modular. Add only the knowledge you need, and it keeps working with the network off."
    >
      <template #actions>
        <UiBadge tone="brand">
          <i class="fa-solid fa-link-slash text-[10px]" aria-hidden="true"></i>
          All modules run offline
        </UiBadge>
      </template>
    </UiPageHeader>

    <div class="mt-6 flex flex-wrap items-center gap-3">
      <div class="relative min-w-[14rem] flex-1">
        <i
          class="fa-solid fa-magnifying-glass pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] text-[#8f9792]"
          aria-hidden="true"
        ></i>
        <UiInput v-model="q" placeholder="Search modules" class="pl-10" />
      </div>
      <p class="text-[12px] text-[#8f9792]">{{ installed.length }} installed · 1.03 GB used</p>
    </div>

    <div class="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
      <button
        v-for="c in moduleCategories"
        :key="c"
        class="shrink-0 rounded-full border px-3 py-1.5 text-[12px] transition-[background-color,border-color,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]"
        :class="
          category === c
            ? 'border-[#0b5d3e] bg-[#eaf3ee] font-medium text-[#0b5d3e]'
            : 'border-[#e4e4de] text-[#606863] hover:text-[#121614]'
        "
        @click="category = c"
      >
        {{ c }}
      </button>
    </div>

    <div v-if="list.length === 0" class="mt-8">
      <UiStatePanel
        title="No modules match"
        body="Try another category, or ask AfroIntel what would help with the work you are doing."
      />
    </div>
    <div v-else class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UiCard v-for="m in list" :key="m.id" class="flex flex-col p-5" interactive>
        <div class="flex items-start justify-between gap-3">
          <h3 class="text-[15px] font-semibold leading-snug text-[#121614]">{{ m.name }}</h3>
          <UiBadge v-if="installed.includes(m.id)" tone="brand">
            <i class="fa-solid fa-check text-[10px]" aria-hidden="true"></i>
            Installed
          </UiBadge>
        </div>
        <p class="mt-2 flex-1 text-[13px] leading-relaxed text-[#606863]">{{ m.blurb }}</p>
        <p class="mt-4 text-[11px] text-[#8f9792]">{{ m.category }} · {{ m.size }} · v{{ m.version }} · works offline</p>

        <div v-if="downloading[m.id] !== undefined" class="mt-3">
          <UiProgress :value="downloading[m.id]" />
          <p class="mt-1.5 text-[11px] text-[#8f9792]">Downloading over Afronet · {{ downloading[m.id] }}%</p>
        </div>
        <UiButton
          v-else
          class="mt-3"
          size="sm"
          :variant="installed.includes(m.id) ? 'secondary' : 'primary'"
          @click="installed.includes(m.id) ? remove(m.id) : install(m.id)"
        >
          <template v-if="!installed.includes(m.id)" #icon>
            <i class="fa-solid fa-download text-[12px]" aria-hidden="true"></i>
          </template>
          {{ installed.includes(m.id) ? 'Remove' : 'Download' }}
        </UiButton>
      </UiCard>
    </div>
  </div>
</template>

<script setup>
import { moduleCategories, modules } from '~/data/models'

useHead({ title: 'AI Module Store — Afronet' })

const category = ref('All')
const q = ref('')
const installed = ref(modules.filter((m) => m.installed).map((m) => m.id))
// { [moduleId]: percent } for modules currently downloading
const downloading = ref({})
const timers = new Set()

const list = computed(() =>
  modules.filter(
    (m) => (category.value === 'All' || m.category === category.value) && m.name.toLowerCase().includes(q.value.toLowerCase()),
  ),
)

// Simulated download: 8% every 110ms, then the module counts as installed.
const install = (id) => {
  downloading.value = { ...downloading.value, [id]: 0 }
  const t = window.setInterval(() => {
    const next = (downloading.value[id] ?? 0) + 8
    if (next >= 100) {
      window.clearInterval(t)
      timers.delete(t)
      installed.value = [...installed.value, id]
      const rest = { ...downloading.value }
      delete rest[id]
      downloading.value = rest
    } else {
      downloading.value = { ...downloading.value, [id]: next }
    }
  }, 110)
  timers.add(t)
}

const remove = (id) => {
  installed.value = installed.value.filter((x) => x !== id)
}

onBeforeUnmount(() => {
  timers.forEach((t) => window.clearInterval(t))
})
</script>
