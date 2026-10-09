<!-- app/components/Pwa/InstallPrompt.vue -->

<!--
  PWA install prompt — bottom-right floating button.
  Android / Chrome / Edge: intercepts beforeinstallprompt, triggers native dialog.
  iOS Safari: no beforeinstallprompt support, shows a step-by-step bottom sheet instead.
  Already-installed (standalone): records the first launch once, then stays hidden.
-->
<template>
  <Teleport to="body">
    <!-- Floating install button -->
    <Transition name="pwa-rise">
      <div v-if="showButton" class="fixed bottom-6 right-5 z-40 flex items-center gap-2">
        <button
          class="flex items-center gap-2.5 rounded-2xl border border-[#e4e4de] bg-[#ffffff] py-2.5 pl-3 pr-4 text-[13px] font-medium text-[#121614] shadow-[0_4px_20px_rgba(0,0,0,0.10)] transition-shadow duration-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.16)]"
          @click="handleInstall"
        >
          <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee]">
            <i class="fa-solid fa-download text-[10px] text-[#0b5d3e]" aria-hidden="true"></i>
          </span>
          Install Afronet
        </button>
        <button
          class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#e4e4de] bg-[#ffffff] text-[#8f9792] shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-colors duration-150 hover:text-[#121614]"
          aria-label="Dismiss"
          @click="dismiss"
        >
          <i class="fa-solid fa-xmark text-[12px]" aria-hidden="true"></i>
        </button>
      </div>
    </Transition>

    <!-- iOS instruction sheet — backdrop -->
    <Transition name="pwa-fade">
      <div
        v-if="showIosSheet"
        class="fixed inset-0 z-50 bg-black/40"
        @click="showIosSheet = false"
      />
    </Transition>

    <!-- iOS instruction sheet — panel -->
    <Transition name="pwa-sheet">
      <div
        v-if="showIosSheet"
        class="fixed inset-x-0 bottom-0 z-50 flex justify-center"
      >
        <div class="w-full max-w-lg rounded-t-3xl border border-[#e4e4de] bg-[#ffffff] px-6 pb-10 pt-4 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]">
          <!-- drag handle -->
          <div class="mx-auto mb-5 h-1 w-10 rounded-full bg-[#e4e4de]" />

          <div class="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 class="text-[17px] font-semibold text-[#121614]">Install Afronet</h2>
              <p class="mt-1 text-[13px] leading-relaxed text-[#606863]">
                Add to your home screen for the full offline AI experience.
              </p>
            </div>
            <button
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f7f7f4] text-[#606863] transition-colors duration-150 hover:text-[#121614]"
              aria-label="Close"
              @click="showIosSheet = false"
            >
              <i class="fa-solid fa-xmark text-[13px]" aria-hidden="true"></i>
            </button>
          </div>

          <ol class="space-y-4">
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-[12px] font-semibold text-[#0b5d3e]">1</span>
              <p class="pt-0.5 text-[14px] leading-snug text-[#121614]">
                Tap the <strong>Share</strong> icon
                <i class="fa-solid fa-arrow-up-from-bracket mx-0.5 text-[#0b5d3e]" aria-hidden="true"></i>
                at the bottom of Safari
              </p>
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-[12px] font-semibold text-[#0b5d3e]">2</span>
              <p class="pt-0.5 text-[14px] leading-snug text-[#121614]">
                Scroll down and tap <strong>Add to Home Screen</strong>
              </p>
            </li>
            <li class="flex items-start gap-3">
              <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#eaf3ee] text-[12px] font-semibold text-[#0b5d3e]">3</span>
              <p class="pt-0.5 text-[14px] leading-snug text-[#121614]">
                Tap <strong>Add</strong> to confirm
              </p>
            </li>
          </ol>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
// usePWA() is auto-imported by @vite-pwa/nuxt.
// The plugin captures beforeinstallprompt before Vue mounts and exposes it via $pwa.
//
// IMPORTANT: $pwa is wrapped in reactive(), which auto-unwraps nested Refs in Vue 3.
// So pwa.showInstallPrompt is the boolean directly — never access .value on it.
//
// pwa.showInstallPrompt  boolean (reactive) — true when native prompt is deferred and ready
// pwa.install()          triggers the native install dialog
// pwa.cancelInstall()    dismisses permanently via localStorage key "vite-pwa:hide-install"
const pwa = usePWA()

const showIosSheet = ref(false)
// iOS dismissal is session-only — we don't use pwa.cancelInstall() for iOS because it sets
// the "vite-pwa:hide-install" localStorage key which would also block Android on the same device.
const iosDismissed = ref(false)

const isIosSafari = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) &&
  /safari/i.test(navigator.userAgent) &&
  !/crios|fxios|opios|chrome/i.test(navigator.userAgent)

// iOS standalone check: matchMedia('display-mode: standalone') doesn't work on iOS —
// must use window.navigator.standalone (set by Safari when launched from the home screen).
const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  !!window.navigator.standalone

const showButton = computed(() => {
  if (isIosSafari()) return !isStandalone() && !iosDismissed.value
  // pwa.showInstallPrompt is a boolean here (reactive auto-unwrap) — no .value needed
  return !!pwa?.showInstallPrompt
})

const recordInstall = async () => {
  try {
    await $fetch('/api/pwa/install', { method: 'POST' })
  } catch {}
}

const onAppInstalled = () => recordInstall()

onMounted(() => {
  // Restore iOS session dismissal
  if (isIosSafari()) {
    iosDismissed.value = !!sessionStorage.getItem('afronet:pwa-ios-dismissed')
  }
  // iOS: record first-ever launch from the home screen, once per device
  if (isStandalone() && isIosSafari() && !localStorage.getItem('afronet:pwa-counted')) {
    localStorage.setItem('afronet:pwa-counted', '1')
    recordInstall()
  }
  // Android / Chrome / Edge: appinstalled fires after user confirms the native dialog
  window.addEventListener('appinstalled', onAppInstalled)
})

onBeforeUnmount(() => {
  window.removeEventListener('appinstalled', onAppInstalled)
})

const handleInstall = async () => {
  if (isIosSafari()) {
    showIosSheet.value = true
    return
  }
  // pwa.install() triggers the deferred native prompt and hides showInstallPrompt
  await pwa?.install()
}

const dismiss = () => {
  if (isIosSafari()) {
    iosDismissed.value = true
    sessionStorage.setItem('afronet:pwa-ios-dismissed', '1')
  } else {
    // cancelInstall() sets localStorage "vite-pwa:hide-install"="true" and
    // removes the beforeinstallprompt listener — hides the button permanently
    pwa?.cancelInstall()
  }
}
</script>

<style scoped>
/* Install button: slides up from bottom-right */
.pwa-rise-enter-active,
.pwa-rise-leave-active {
  transition: opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1),
              transform 0.25s cubic-bezier(0.23, 1, 0.32, 1);
}
.pwa-rise-enter-from,
.pwa-rise-leave-to {
  opacity: 0;
  transform: translateY(12px);
}

/* iOS backdrop: fades */
.pwa-fade-enter-active,
.pwa-fade-leave-active {
  transition: opacity 0.2s ease;
}
.pwa-fade-enter-from,
.pwa-fade-leave-to {
  opacity: 0;
}

/* iOS sheet panel: slides up */
.pwa-sheet-enter-active,
.pwa-sheet-leave-active {
  transition: opacity 0.25s cubic-bezier(0.23, 1, 0.32, 1),
              transform 0.3s cubic-bezier(0.23, 1, 0.32, 1);
}
.pwa-sheet-enter-from,
.pwa-sheet-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
