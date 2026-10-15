<!-- app/components/Studio/StepIdea.vue -->

<!--
  Step one: the idea, in the developer's own words. The minimum length is not bureaucracy —
  a one-word prompt produces a generic app, and saying so here is kinder than letting
  someone spend a generation to find out.
-->
<template>
  <div>
    <h1 class="font-['Instrument_Serif',Georgia,serif] text-[28px] leading-tight text-[#121614]">
      What do you want to build?
    </h1>
    <p class="mt-1 text-[14px] text-[#606863]">
      Describe the app you want to create. You do not need to know how to code.
    </p>

    <UiTextarea
      v-model="model"
      :rows="5"
      aria-label="Describe your app"
      placeholder="e.g. A quiz app with JAMB past questions in Chemistry. Show the right answer with an explanation, and keep my score."
      class="mt-5 text-[15px]"
    />

    <p class="mt-1.5 text-[12px]" :class="tooShort ? 'text-[#b07f15]' : 'text-[#606863]'">
      {{
        tooShort
          ? 'Add a bit more detail — who is it for, and what should it do?'
          : 'Good — specific details give better results.'
      }}
    </p>

    <p class="mt-5 text-[12.5px] font-medium text-[#606863]">Try one of these</p>
    <div class="mt-2 flex flex-wrap gap-2">
      <button
        v-for="s in suggestedPrompts"
        :key="s"
        class="rounded-full border border-[#e4e4de] px-3 py-1.5 text-left text-[12.5px] font-medium text-[#121614] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-[#f7f7f4]"
        @click="model = s"
      >
        {{ s }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { suggestedPrompts } from '~/data/studio'

const model = defineModel({ type: String, default: '' })

const tooShort = computed(() => model.value.trim().length < 15)
</script>
