<!-- app/components/Runtime/SettingsDrawer.vue -->

<!--
  What this app is, what it may do, and how to stop it.

  The two lists in the middle are read from the package's own manifest — not from a list
  Afronet keeps about apps in general. What a person sees here is what this exact package
  declared, which is also exactly what the bridge will allow it to do. Anything else it tries
  is refused.

  Teleported to <body> for the same reason UiModal is: the runtime header has a backdrop
  filter, which would otherwise become the containing block for a fixed panel.
-->
<template>
  <Teleport to="body">
    <Transition name="drawer" :duration="260">
      <div v-if="open" class="fixed inset-0 z-50">
        <div class="drawer-backdrop absolute inset-0 bg-black/50" @click="emit('close')" />

        <aside
          class="drawer-panel afro-scroll absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-[#ffffff] p-5 font-[Inter,ui-sans-serif,system-ui,sans-serif]"
          role="dialog"
          aria-modal="true"
          :aria-label="`${app.name} settings`"
        >
          <div class="flex items-start justify-between gap-4">
            <h2 class="text-[16px] font-semibold text-[#121614]">{{ app.name }} settings</h2>
            <UiIconButton label="Close settings" @click="emit('close')">
              <i class="fa-solid fa-xmark text-[14px]" aria-hidden="true"></i>
            </UiIconButton>
          </div>

          <dl class="mt-4 space-y-2 rounded-2xl bg-[#f7f7f4] p-4 text-[13px]">
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Version</dt>
              <dd class="font-semibold text-[#121614]">{{ inst.version }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">App files</dt>
              <dd class="font-semibold text-[#121614]">{{ formatMB(packageMB) }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-[#606863]">Saved in this app</dt>
              <dd class="font-semibold text-[#121614]">{{ formatMB(inst.dataMB) }}</dd>
            </div>
            <div v-if="manifest" class="flex justify-between gap-4">
              <dt class="text-[#606863]">Package</dt>
              <dd class="font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[11px] text-[#121614]">
                {{ shortChecksum }}
              </dd>
            </div>
          </dl>

          <h3 class="mt-5 text-[13px] font-semibold text-[#121614]">Permissions</h3>
          <ul v-if="app.permissions.length" class="mt-2 space-y-3">
            <li v-for="perm in app.permissions" :key="perm.id" class="flex items-start justify-between gap-3 text-[13px]">
              <span class="min-w-0">
                <span class="block font-medium text-[#121614]">{{ perm.label }}</span>
                <span class="text-[#606863]">{{ perm.reason }}</span>
              </span>
              <button
                v-if="perm.id === 'microphone'"
                class="shrink-0 text-[12px] font-medium text-[#0b5d3e] hover:underline"
                @click="emit('permission', perm.id, micGranted ? 'denied' : 'granted')"
              >
                {{ micGranted ? 'Revoke' : 'Allow' }}
              </button>
              <span v-else class="shrink-0 text-[12px] text-[#8f9792]">Granted</span>
            </li>
          </ul>
          <p v-else class="mt-2 text-[13px] text-[#606863]">This app requests no permissions.</p>

          <h3 class="mt-5 text-[13px] font-semibold text-[#121614]">What this app can ask Afronet for</h3>
          <ul v-if="calls.length" class="mt-2 space-y-2">
            <li v-for="call in calls" :key="call.id" class="flex gap-2 text-[12.5px]">
              <i class="fa-solid fa-circle-check mt-1 shrink-0 text-[10px] text-[#0b5d3e]" aria-hidden="true"></i>
              <span>
                <span class="font-medium text-[#121614]">{{ call.label }}</span>
                <span class="block text-[#606863]">{{ call.detail }}</span>
              </span>
            </li>
          </ul>
          <p v-else class="mt-2 text-[12.5px] text-[#606863]">
            Nothing. This app runs entirely inside its own frame.
          </p>

          <h3 class="mt-5 text-[13px] font-semibold text-[#121614]">What it can never reach</h3>
          <ul class="mt-2 space-y-1.5">
            <li v-for="d in bridgeDenied" :key="d" class="flex gap-2 text-[12.5px] text-[#606863]">
              <i class="fa-solid fa-xmark mt-0.5 shrink-0 text-[10px] text-[#b22c26]" aria-hidden="true"></i>
              {{ d }}
            </li>
          </ul>

          <div class="mt-5 rounded-2xl border border-[#e4e4de] p-4 text-[12.5px] leading-relaxed text-[#606863]">
            <p class="flex items-center gap-1.5 font-semibold text-[#121614]">
              <i class="fa-solid fa-shield-halved text-[12px] text-[#0b5d3e]" aria-hidden="true"></i>
              {{ runtimeCopy.sandboxTitle }}
            </p>
            {{ runtimeCopy.sandboxBody }}
          </div>

          <!-- What the app has asked Afronet for ------------------------------->
          <div class="mt-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-[13px] font-semibold text-[#121614]">What this app has asked for</h3>
              <button
                v-if="bridgeLog.length"
                class="text-[12px] font-medium text-[#606863] hover:text-[#121614]"
                @click="clearBridgeLog"
              >
                Clear
              </button>
            </div>

            <ul v-if="bridgeLog.length" class="mt-2 space-y-1">
              <li
                v-for="(entry, i) in bridgeLog.slice(0, 12)"
                :key="`${entry.at}-${i}`"
                class="flex items-baseline gap-2 rounded-lg bg-[#f7f7f4] px-2.5 py-1.5 text-[11.5px]"
              >
                <i
                  class="fa-solid shrink-0 text-[9px]"
                  :class="entry.ok ? 'fa-circle-check text-[#0b5d3e]' : 'fa-circle-xmark text-[#b22c26]'"
                  aria-hidden="true"
                ></i>
                <span class="font-[ui-monospace,SFMono-Regular,Menlo,monospace] text-[#121614]">
                  {{ entry.call }}<template v-if="entry.key">("{{ entry.key }}")</template>
                </span>
                <span class="ml-auto shrink-0 text-right text-[#606863]">
                  <template v-if="!entry.ok">{{ entry.error }}</template>
                  <template v-else-if="entry.call === 'storage.get'">
                    {{ entry.found ? 'found' : 'nothing saved' }}
                  </template>
                  <template v-else>done</template>
                </span>
              </li>
            </ul>

            <p v-else class="mt-2 rounded-lg bg-[#f7f7f4] px-2.5 py-2 text-[11.5px] leading-relaxed text-[#606863]">
              Nothing yet. An app that keeps your work asks here when it opens, and again each time
              you change something — so if this stays empty, it is not saving at all.
            </p>
          </div>

          <div class="mt-5 space-y-2">
            <UiButton variant="secondary" block @click="emit('restart')">
              <template #icon><i class="fa-solid fa-rotate-left text-[11px]" aria-hidden="true"></i></template>
              Restart app
            </UiButton>
            <UiButton variant="secondary" block :to="`/store/app/${app.id}`">View in store</UiButton>
            <UiButton variant="danger" block @click="emit('clear-data')">Clear app data</UiButton>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { bridgeCallMeta, bridgeDenied, runtimeCopy } from '~/data/runtime'
import { formatMB } from '~/data/store'

const props = defineProps({
  open: { type: Boolean, default: false },
  app: { type: Object, required: true },
  inst: { type: Object, required: true },
  /** The running package's manifest, once it has been fetched. */
  manifest: { type: Object, default: null },
  micGranted: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'restart', 'clear-data', 'permission'])

const { bridgeLog, clearBridgeLog } = useAppBridge()

/** The real size of what was downloaded, once known; the listing's figure until then. */
const packageMB = computed(() =>
  props.manifest?.sizeBytes ? props.manifest.sizeBytes / 1048576 : props.inst.appFilesMB,
)

const calls = computed(() =>
  (props.manifest?.bridgeCalls ?? [])
    .map((id) => ({ id, ...(bridgeCallMeta[id] ?? { label: id, detail: '' }) })),
)

const shortChecksum = computed(() => String(props.manifest?.checksum ?? '').slice(0, 19) + '…')
</script>

<style scoped>
/* The backdrop fades, the panel slides in from the edge it is anchored to. */
.drawer-enter-active .drawer-backdrop,
.drawer-leave-active .drawer-backdrop {
  transition: opacity 0.22s cubic-bezier(0.23, 1, 0.32, 1);
}

.drawer-enter-active .drawer-panel,
.drawer-leave-active .drawer-panel {
  transition: transform 0.26s cubic-bezier(0.23, 1, 0.32, 1);
}

.drawer-enter-from .drawer-backdrop,
.drawer-leave-to .drawer-backdrop {
  opacity: 0;
}

.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

@media (prefers-reduced-motion: reduce) {
  .drawer-enter-active .drawer-backdrop,
  .drawer-leave-active .drawer-backdrop,
  .drawer-enter-active .drawer-panel,
  .drawer-leave-active .drawer-panel {
    transition: none;
  }
}
</style>
