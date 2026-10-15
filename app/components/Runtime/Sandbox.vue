<!-- app/components/Runtime/Sandbox.vue -->

<!--
  A downloaded app, running.
  -------------------------------------------------------------------------
  The frame carries `sandbox="allow-scripts"` and nothing else. Without `allow-same-origin`
  the browser gives it an opaque origin, which means the app cannot read this page, our
  cookies, our storage, or any other app's data — not by policy, but because the browser will
  not let it. Its own localStorage and IndexedDB are unavailable for the same reason, which is
  why everything it saves goes through the bridge and is namespaced by Afronet.

  The package's own document carries a content-security policy that forbids network requests
  and external resources, so an app cannot quietly phone home either.

  How the document gets in
  ------------------------
  The files are turned into a blob and the frame is pointed at it. A blob address is created
  by Afronet, lives only in this tab, and is withdrawn when the app closes, so there is still
  no address an app could be opened from anywhere else — and because the frame is sandboxed
  without same-origin access, the document that loads there is still on an origin of its own.

  Navigating to an address is the ordinary path a browser is built for. Writing a document
  into a frame with srcdoc is not: an iframe begins loading its own empty document the moment
  it enters the page, and a srcdoc set before that settles is discarded, leaving a frame that
  reports itself loaded while drawing nothing. srcdoc remains here as a fallback for any
  browser that will not navigate to a blob, and the frame reports which route it took.

  An app that never starts says so. A frame that renders nothing is indistinguishable from a
  broken Afronet, so the watchdog below is armed independently of whether the document could
  be handed over at all. What it watches for is the frame failing to load — not the app
  failing to introduce itself, which is something only a templated app ever did.
-->
<template>
  <div class="relative flex min-h-0 flex-1 flex-col">
    <iframe
      ref="frame"
      class="min-h-0 w-full flex-1 border-0 bg-[#ffffff]"
      :title="title"
      sandbox="allow-scripts"
      referrerpolicy="no-referrer"
      @load="onLoad"
    ></iframe>

    <div
      v-if="stalled"
      class="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#ffffff] p-6 text-center"
    >
      <i class="fa-solid fa-triangle-exclamation text-[20px] text-[#b07f15]" aria-hidden="true"></i>
      <p class="text-[14px] font-semibold text-[#121614]">{{ title }} didn’t start</p>
      <p class="max-w-xs text-[12.5px] leading-relaxed text-[#606863]">
        It was downloaded and verified, but it hasn’t drawn anything. Reloading usually helps.
      </p>

      <dl class="mt-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-left text-[11.5px] text-[#8f9792]">
        <dt>Route</dt>
        <dd>{{ route || 'nothing handed over' }}</dd>
        <dt>Frame</dt>
        <dd>{{ frameLoaded ? 'loaded' : 'never loaded' }}</dd>
        <dt>Entry</dt>
        <dd>{{ pkg?.manifest?.entryPoint ?? '—' }}</dd>
        <dt>Files</dt>
        <dd>{{ fileNames || '—' }}</dd>
        <dt>Size</dt>
        <dd>{{ html.length }} characters</dd>
      </dl>

      <UiButton size="sm" variant="secondary" class="mt-2" @click="start">Reload the app</UiButton>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  /** A package: { manifest, files }. */
  pkg: { type: Object, required: true },
  /** What this app's storage is namespaced under — a listing id, or a preview id. */
  appId: { type: String, required: true },
  title: { type: String, default: 'App' },
  /** Bumped by the host to restart the app from scratch. */
  runKey: { type: Number, default: 0 },
})

const emit = defineEmits(['ready'])

const { createBridge } = useAppBridge()

const frame = ref(null)
const frameLoaded = ref(false)
const ready = ref(false)
const stalled = ref(false)
/** 'blob' or 'srcdoc' — which way the document was handed over. */
const route = ref('')

const html = computed(() => props.pkg?.files?.[props.pkg?.manifest?.entryPoint] ?? '')

const fileNames = computed(() => Object.keys(props.pkg?.files ?? {}).join(', '))

let bridge = null
let watchdog = null
let fallbackTimer = null
let blobUrl = ''

/**
 * Whether a load event belongs to the document we just handed over.
 *
 * A frame begins life showing an empty document of its own, and that one reports a load too.
 * Only loads that arrive after a source has been set are the app's.
 */
let armed = false

const detach = () => {
  bridge?.stop()
  bridge = null
}

const revoke = () => {
  if (!blobUrl) return
  URL.revokeObjectURL(blobUrl)
  blobUrl = ''
}

const clearTimers = () => {
  clearTimeout(watchdog)
  clearTimeout(fallbackTimer)
}

/** The last resort: write the document in directly, the way a frame will accept it. */
const useSrcdoc = () => {
  const el = frame.value
  if (!el || frameLoaded.value) return
  route.value = 'srcdoc'
  const document_ = html.value
  el.removeAttribute('src')
  el.srcdoc = ''
  nextTick(() => {
    const current = frame.value
    if (!current) return
    armed = true
    current.srcdoc = document_
  })
}

/** Point the frame at the package. */
const start = () => {
  if (!import.meta.client) return

  detach()
  clearTimers()
  revoke()
  armed = false
  ready.value = false
  frameLoaded.value = false
  stalled.value = false

  // Armed first and independently: however the handover goes, a frame that never loads has
  // to be able to say so.
  watchdog = setTimeout(() => {
    if (!frameLoaded.value) stalled.value = true
  }, 4000)

  const el = frame.value
  if (!el) return

  // Listening starts before the document does.
  //
  // An app is told to ask for its saved state as it starts, and the document's scripts run in
  // their own task — before the load event. A bridge attached on load missed that first call
  // every time, so an app saved perfectly well and got nothing back when it reopened. The
  // frame window is resolved per message rather than captured, because the frame has not
  // navigated yet at this point.
  bridge = createBridge({
    appId: props.appId,
    allowed: props.pkg?.manifest?.bridgeCalls ?? [],
    frameWindow: () => frame.value?.contentWindow,
    onReady: () => {},
  })
  bridge.start()

  try {
    blobUrl = URL.createObjectURL(new Blob([html.value], { type: 'text/html' }))
    route.value = 'blob'
    el.removeAttribute('srcdoc')
    armed = true
    el.setAttribute('src', blobUrl)
  } catch {
    useSrcdoc()
    return
  }

  // If the browser will not navigate a sandboxed frame to a blob, fall back rather than
  // leaving an empty frame.
  fallbackTimer = setTimeout(() => {
    if (!frameLoaded.value) useSrcdoc()
  }, 1500)
}

/**
 * The app's document has loaded, which is the browser saying the handover worked. That is the
 * signal the runtime trusts.
 *
 * It used to wait for the app itself to say hello over the bridge, which worked only because
 * every app was rendered from a template that had the bridge script written into it. An app
 * written from a description owes us no such greeting, and waiting for one meant a perfectly
 * good app was replaced at 1.5 seconds and covered by a failure panel at 4 — after the person
 * had already seen it running.
 */
const onLoad = () => {
  if (!armed) return

  frameLoaded.value = true
  ready.value = true
  stalled.value = false
  clearTimers()

  // The bridge was attached before the document loaded and stays attached: it resolves the
  // frame window per message, so a navigation does not leave it talking to the old one.
  emit('ready')
}

onMounted(start)

// A new package — a rebuilt preview, or a different app — replaces the document.
watch(html, start)

// A restart from the host.
watch(() => props.runKey, start)

onBeforeUnmount(() => {
  clearTimers()
  detach()
  revoke()
})
</script>
