// app/composables/useAppBridge.js
//
// Afronet's side of the bridge: the only way a running app can reach anything outside its
// frame, and the place every one of its requests is checked.
//
// The frame itself is the first line of defence — a sandbox without same-origin access, on an
// opaque origin, with a content-security policy that forbids network and external resources.
// An app there cannot read this page, its cookies, its storage, or anyone else's app. This
// file is the second: of the few things it *can* ask for, each one is checked against what the
// package declared, then validated, then namespaced to that app.
//
// Three rules, from the developer guide:
//
//   1. A call the manifest did not declare is refused, whatever the app's code tries.
//   2. Storage is namespaced by app id. An app cannot name another app's data.
//   3. Nothing is trusted by size or shape — keys, values and messages are all bounded, so a
//      misbehaving app cannot fill the device or hang the host.

/** Everything the bridge can ever do. A call outside this list does not exist. */
const KNOWN_CALLS = ['storage.get', 'storage.set', 'ui.toast', 'net.fetch']

const MAX_KEY = 64
const MAX_KEYS_PER_APP = 20
/** Per value, serialised. Enough for progress and settings, not for an app to hoard. */
const MAX_VALUE_BYTES = 64 * 1024
const MAX_TOAST = 120

export function useAppBridge() {
  const { appData, setAppData, notify } = useAppLibrary()

  /**
   * Builds a handler for one running app.
   *
   * `appId` namespaces its storage; `allowed` is the manifest's own list of calls. The frame
   * window is passed in so replies go only to the frame that asked, and so a message claiming
   * to be from the app but coming from anywhere else is ignored.
   */
  const createBridge = ({ appId, allowed, frameWindow, onReady }) => {
    const permitted = (allowed ?? []).filter((c) => KNOWN_CALLS.includes(c))

    // Looked up when a message arrives, not when the bridge is built.
    //
    // The host has to be listening before the app's code runs, and at that moment the frame
    // has not navigated yet — so the window to compare against does not exist. Capturing it
    // up front meant listening could only start on the load event, which is a later task
    // than the document's scripts: an app asking for its saved state as it started was
    // asking into a room nobody was in yet. It saved fine and never read anything back.
    const target = () => (typeof frameWindow === 'function' ? frameWindow() : frameWindow)

    const dataFor = () => appData.value[appId] ?? {}

    const handle = async (call, args) => {
      if (!permitted.includes(call)) {
        throw new Error('This app did not declare that it needed to do that')
      }

      if (call === 'storage.get') {
        const key = String(args?.key ?? '')
        if (!key || key.length > MAX_KEY) throw new Error('Bad key')
        return dataFor()[key] ?? null
      }

      if (call === 'storage.set') {
        const key = String(args?.key ?? '')
        if (!key || key.length > MAX_KEY) throw new Error('Bad key')

        let serialised
        try {
          serialised = JSON.stringify(args?.value ?? null)
        } catch {
          throw new Error('That value cannot be saved')
        }
        if (serialised.length > MAX_VALUE_BYTES) throw new Error('That value is too large to save')

        const current = dataFor()
        if (!(key in current) && Object.keys(current).length >= MAX_KEYS_PER_APP) {
          throw new Error('This app has saved as much as it is allowed to')
        }

        setAppData(appId, { ...current, [key]: JSON.parse(serialised) })
        return true
      }

      if (call === 'ui.toast') {
        notify(String(args?.message ?? '').slice(0, MAX_TOAST))
        return true
      }

      // Declared, but there is nothing behind it yet. An app that asks is told plainly rather
      // than left waiting: the proxy that would make this safe is still to be built.
      throw new Error('Reaching the network is not available in this release')
    }

    const onMessage = async (event) => {
      // Only the frame we started. Anything else — another frame, an extension, the page
      // itself — is not this app and is ignored.
      const frame = target()
      if (!frame || event.source !== frame) return

      const message = event.data
      if (!message || message.afronet !== 1) return

      if (message.event === 'ready') {
        onReady?.()
        return
      }

      const id = message.id
      if (typeof id !== 'number' || typeof message.call !== 'string') return

      try {
        const result = await handle(message.call, message.args)
        target()?.postMessage({ afronet: 1, id, ok: true, result }, '*')
      } catch (error) {
        target()?.postMessage({ afronet: 1, id, ok: false, error: error.message }, '*')
      }
    }

    return {
      onMessage,
      start: () => window.addEventListener('message', onMessage),
      stop: () => window.removeEventListener('message', onMessage),
    }
  }

  return { createBridge, KNOWN_CALLS }
}
