<!-- app/components/Studio/PreviewApp.vue -->

<!--
  The build, running, in the same sandbox the store's runtime uses.

  It fetches the package the server would deliver for this build — rendered from the same
  config, by the same code — so what a developer approves here is what a user gets. Changing
  the build changes the package, so the preview reloads whenever the config does.

  Its storage is namespaced under a preview id, so trying something here can never touch the
  data of the published app this build will become.
-->
<template>
  <!--
    Sized by its container rather than by a height of its own, so the same component fills a
    phone frame, a desktop frame and whatever the pane has room for.
  -->
  <div class="flex min-h-0 w-full flex-1 flex-col">
    <div v-if="pending" class="flex flex-1 flex-col items-center justify-center gap-3 bg-[#ffffff]">
      <UiSpinner />
      <p class="text-[12.5px] text-[#606863]">Building a preview…</p>
    </div>

    <div v-else-if="!loaded?.pkg" class="flex flex-1 flex-col items-center justify-center gap-2 bg-[#ffffff] p-6 text-center">
      <i class="fa-solid fa-triangle-exclamation text-[18px] text-[#b22c26]" aria-hidden="true"></i>
      <p class="text-[13px] font-medium text-[#121614]">This build could not be previewed</p>
      <p class="text-[12.5px] text-[#606863]">{{ loaded?.error ?? 'Something went wrong building it.' }}</p>
      <UiButton size="sm" variant="secondary" class="mt-2" @click="refresh">Try again</UiButton>
    </div>

    <RuntimeSandbox
      v-else
      :pkg="loaded.pkg"
      :app-id="`preview-${app.id}`"
      :title="`${app.name} preview`"
      :run-key="runKey"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  app: { type: Object, required: true },
})

const { load, forget } = useAppPackage()

const loaded = ref(null)
const pending = ref(true)
const runKey = ref(0)

const url = computed(() => `/api/studio/apps/${props.app.id}/package`)

const refresh = async () => {
  if (!import.meta.client) return
  pending.value = true
  forget(url.value)
  loaded.value = await load(url.value, { force: true })
  runKey.value += 1
  pending.value = false
}

onMounted(refresh)

// Any change to the build produces a different package, so the preview is rebuilt. Watching
// the config rather than the whole record keeps a rename from reloading the running app.
watch(
  () => JSON.stringify(props.app.config),
  () => refresh(),
)
</script>
