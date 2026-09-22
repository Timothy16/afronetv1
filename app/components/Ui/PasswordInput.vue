<!-- app/components/Ui/PasswordInput.vue -->

<!-- UiInput with a show/hide toggle. Extra attrs (autocomplete, placeholder…) pass through to the input. -->
<template>
  <div class="relative">
    <UiInput v-model="model" v-bind="$attrs" :type="visible ? 'text' : 'password'" :size="size" class="pr-11" />
    <button
      type="button"
      class="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-[#8f9792] transition-colors duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:text-[#121614]"
      :aria-label="visible ? 'Hide password' : 'Show password'"
      :aria-pressed="visible"
      :title="visible ? 'Hide password' : 'Show password'"
      @click="visible = !visible"
    >
      <i class="fa-solid text-[14px]" :class="visible ? 'fa-eye-slash' : 'fa-eye'" aria-hidden="true"></i>
    </button>
  </div>
</template>

<script setup>
defineOptions({ inheritAttrs: false })

defineProps({
  // md | sm | lg — same as UiInput
  size: { type: String, default: 'md' },
})

const model = defineModel({ type: [String, Number], default: '' })
const visible = ref(false)
</script>
