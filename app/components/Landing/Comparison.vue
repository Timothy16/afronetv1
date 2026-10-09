<!-- app/components/Landing/Comparison.vue -->

<!--
  "What needs what?" — the two things people conflate. Offline AI runs on the
  device; calls and messages need other AFRONET users and local coverage.
  A toggle on narrow screens, both columns side by side from `sm` up, where
  the comparison is the whole point and there is room to show it.
-->
<template>
  <div class="rounded-[24px] bg-[#ffffff] p-5 ring-1 ring-[#e4e4de] sm:p-6">
    <h3 class="font-['Instrument_Serif',Georgia,serif] text-[22px] leading-tight tracking-tight text-[#121614]">
      What needs what?
    </h3>

    <!-- Narrow: pick a column -->
    <div class="mt-4 grid grid-cols-2 gap-1 rounded-full bg-[#f7f7f4] p-1 sm:hidden" role="tablist" aria-label="Compare features">
      <button
        v-for="option in comparisonModes"
        :key="option.id"
        role="tab"
        :aria-selected="mode === option.id"
        class="h-9 rounded-full text-[13px] font-semibold transition-colors duration-150"
        :class="mode === option.id ? 'bg-[#0b5d3e] text-[#ffffff]' : 'text-[#606863]'"
        @click="mode = option.id"
      >
        {{ option.label }}
      </button>
    </div>

    <dl class="mt-4 divide-y divide-[#e4e4de] sm:hidden">
      <div v-for="row in comparisonRows" :key="row.label" class="py-3">
        <dt class="text-[12px] font-semibold text-[#606863]">{{ row.label }}</dt>
        <dd class="mt-0.5 text-sm font-semibold text-[#121614]">{{ row[activeKey] }}</dd>
      </div>
    </dl>

    <!-- Wide: the real table -->
    <table class="mt-5 hidden w-full text-left sm:table">
      <thead>
        <tr class="border-b border-[#e4e4de]">
          <th scope="col" class="w-1/3 pb-3 text-[12px] font-semibold uppercase tracking-wide text-[#8f9792]"></th>
          <th
            v-for="option in comparisonModes"
            :key="option.id"
            scope="col"
            class="pb-3 pl-4 text-[13px] font-semibold text-[#121614]"
          >
            {{ option.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in comparisonRows" :key="row.label" class="border-b border-[#e4e4de] last:border-0 align-top">
          <th scope="row" class="py-3.5 pr-4 text-[13px] font-medium text-[#606863]">{{ row.label }}</th>
          <td v-for="option in comparisonModes" :key="option.id" class="py-3.5 pl-4 text-sm text-[#121614]">
            {{ row[option.key] }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { comparisonModes, comparisonRows } from '~/data/landing'

const mode = ref(comparisonModes[0].id)

const activeKey = computed(() => comparisonModes.find((option) => option.id === mode.value)?.key ?? 'offlineAi')
</script>
