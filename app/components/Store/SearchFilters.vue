<!-- app/components/Store/SearchFilters.vue -->

<!--
  The filters for Discover, in one component because they appear twice: as a sidebar on a
  wide screen and inside a sheet on a phone. One definition, so the two can never drift.

  Download size is a filter in its own right, not an afterthought: on a metered connection
  it is usually the first question anyone asks about an app.
-->
<template>
  <div>
    <div class="border-b border-[#e4e4de] pb-4">
      <p class="mb-2 text-[12.5px] font-semibold text-[#121614]">Price</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="o in prices"
          :key="o.value"
          :class="chip(model.price === o.value)"
          @click="set({ price: o.value })"
        >
          {{ o.label }}
        </button>
      </div>
    </div>

    <div class="mt-4 border-b border-[#e4e4de] pb-4">
      <p class="mb-2 text-[12.5px] font-semibold text-[#121614]">Download size</p>
      <div class="flex flex-wrap gap-1.5">
        <button v-for="o in sizes" :key="o.value" :class="chip(model.size === o.value)" @click="set({ size: o.value })">
          {{ o.label }}
        </button>
      </div>
    </div>

    <div class="mt-4 border-b border-[#e4e4de] pb-4">
      <p class="mb-2 text-[12.5px] font-semibold text-[#121614]">Rating</p>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="o in ratings"
          :key="o.value"
          :class="chip(model.rating === o.value)"
          @click="set({ rating: o.value })"
        >
          {{ o.label }}
        </button>
      </div>
    </div>

    <label class="mt-4 flex items-center gap-2 text-[13px] font-medium text-[#121614]">
      <input
        type="checkbox"
        class="h-4 w-4 accent-[#0b5d3e]"
        :checked="model.recent"
        @change="set({ recent: !model.recent })"
      />
      Updated in the last 30 days
    </label>
  </div>
</template>

<script setup>
const model = defineModel({ type: Object, required: true })

const prices = [
  { value: 'all', label: 'Any' },
  { value: 'free', label: 'Free' },
  { value: 'paid', label: 'Paid' },
]

const sizes = [
  { value: 0, label: 'Any' },
  { value: 10, label: 'Under 10 MB' },
  { value: 50, label: 'Under 50 MB' },
]

const ratings = [
  { value: 0, label: 'Any' },
  { value: 4, label: '4.0+' },
  { value: 4.5, label: '4.5+' },
]

const set = (patch) => {
  model.value = { ...model.value, ...patch }
}

const chip = (on) => [
  'rounded-lg border px-2.5 py-1.5 text-[12.5px] font-medium transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]',
  on ? 'border-[#121614] bg-[#121614] text-[#ffffff]' : 'border-[#e4e4de] bg-[#ffffff] text-[#606863] hover:text-[#121614]',
]
</script>
