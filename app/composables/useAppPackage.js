// app/composables/useAppPackage.js
//
// Fetching an app's package, keeping it on the device, and checking it before anything runs.
//
// The check is the point. The store tells people nothing is installed until it passes
// verification, and the runtime says "Verifying…" before an app starts — this is what makes
// both of those true rather than decorative. The checksum is recomputed from the files that
// actually arrived and compared with the one in the manifest; a mismatch means the package is
// not the one that was approved, and it does not run.
//
// Downloading is a real transfer. The response is read as it arrives, so the progress a
// person watches is the bytes that have actually landed, and what finishes is kept in the
// browser's Cache Storage. An installed app opens from there: it is on the device, which is
// what "installed" has to mean, and what makes removing one free real space.
//
// One honest exception: the browser's crypto is only available over https or on localhost.
// Opened any other way — a phone pointed at a laptop's IP during testing — there is no way to
// verify, so the app runs and says so, rather than being blocked by an artefact of testing.

/** Where downloaded packages live. Bumped if the stored shape ever changes. */
const CACHE_NAME = 'afronet-apps-v1'

export function useAppPackage() {
  const apiFetch = useRequestFetch()

  // Packages already in hand this session, so re-entering an app does not re-read them.
  const packages = useState('runtime:packages', () => ({}))

  const cacheOpen = async () => {
    if (!import.meta.client || !globalThis.caches) return null
    try {
      return await caches.open(CACHE_NAME)
    } catch {
      // Private browsing, or storage refused. Everything still works over the network.
      return null
    }
  }

  /** Exactly what the server hashes: each file, name then contents, in name order. */
  const canonical = (files) =>
    Object.keys(files)
      .sort()
      .map((name) => `${name}\u0000${files[name]}\u0000`)
      .join('')

  const sha256 = async (text) => {
    const bytes = new TextEncoder().encode(text)
    const digest = await crypto.subtle.digest('SHA-256', bytes)
    return `sha256-${[...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')}`
  }

  /**
   * 'verified' — the files are the ones the manifest describes.
   * 'unverifiable' — this browser cannot hash anything here (not a secure context).
   * 'mismatch' — the files are not what was approved. The app must not run.
   */
  const verify = async (pkg) => {
    if (!pkg?.manifest?.checksum || !pkg?.files) return 'mismatch'
    if (!import.meta.client || !globalThis.crypto?.subtle) return 'unverifiable'
    try {
      const actual = await sha256(canonical(pkg.files))
      return actual === pkg.manifest.checksum ? 'verified' : 'mismatch'
    } catch {
      return 'unverifiable'
    }
  }

  const wellFormed = (pkg) => Boolean(pkg?.manifest && pkg?.files?.[pkg.manifest.entryPoint])

  /** What this device has already downloaded, read straight from Cache Storage. */
  const fromCache = async (url) => {
    const cache = await cacheOpen()
    if (!cache) return null
    try {
      const hit = await cache.match(url)
      if (!hit) return null
      const body = await hit.json()
      return wellFormed(body?.data) ? body.data : null
    } catch {
      return null
    }
  }

  /**
   * Downloads a package, reporting real progress as it arrives.
   *
   * `onProgress` is called with 0–100. When the server does not say how long the response is,
   * progress climbs towards 90% against the size the manifest promised, rather than inventing
   * a figure or jumping straight to done.
   */
  const download = async (url, { onProgress, expectedBytes = 0 } = {}) => {
    const res = await fetch(url, { headers: { accept: 'application/json' }, credentials: 'same-origin' })
    if (!res.ok) throw new Error(`The server refused the download (${res.status}).`)

    const declared = Number(res.headers.get('content-length')) || 0
    const total = declared || expectedBytes

    // No reader means no progress to report — read it in one go rather than fail.
    if (!res.body?.getReader) {
      const body = await res.json()
      onProgress?.(100)
      return body?.data
    }

    const reader = res.body.getReader()
    const chunks = []
    let received = 0

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
      received += value.length
      if (total) onProgress?.(Math.min(declared ? 100 : 90, (received / total) * 100))
      else onProgress?.(-1)
    }

    const merged = new Uint8Array(received)
    let at = 0
    for (const chunk of chunks) {
      merged.set(chunk, at)
      at += chunk.length
    }

    onProgress?.(100)

    const text = new TextDecoder().decode(merged)
    const body = JSON.parse(text)

    // Kept only once it has arrived whole. A half-written cache entry is worse than none.
    const cache = await cacheOpen()
    if (cache) {
      try {
        await cache.put(url, new Response(text, { headers: { 'content-type': 'application/json' } }))
      } catch {
        // Over quota, or refused. The app still runs from what is in hand.
      }
    }

    // What was held in memory is now the previous version. Shipping an update would otherwise
    // keep opening the old app until the tab was reloaded.
    forget(url)

    return body?.data
  }

  /** Removes a downloaded package from the device. What uninstalling actually frees. */
  const evict = async (url) => {
    const cache = await cacheOpen()
    if (cache) {
      try {
        await cache.delete(url)
      } catch {
        // Nothing to do: it is either gone or unreachable.
      }
    }
    forget(url)
  }

  /**
   * Loads a package and checks it.
   *
   * The device first: an installed app opens from what was downloaded, which is why it opens
   * at all when the server cannot be reached. Falls back to the network for an app being
   * looked at rather than installed — a preview, or a listing someone is browsing.
   *
   * Returns { pkg, state } where state is the verification result, or { error }.
   */
  const load = async (url, { force = false } = {}) => {
    if (!force && packages.value[url]) return packages.value[url]

    let pkg = force ? null : await fromCache(url)

    if (!pkg) {
      try {
        const res = await apiFetch(url)
        pkg = res?.data
      } catch (e) {
        return { error: e?.data?.message || 'This app could not be fetched.' }
      }
    }

    if (!wellFormed(pkg)) return { error: 'This package is missing its entry point.' }

    const state = await verify(pkg)
    const result = { pkg, state }
    packages.value = { ...packages.value, [url]: result }
    return result
  }

  const forget = (url) => {
    const next = { ...packages.value }
    delete next[url]
    packages.value = next
  }

  return { load, verify, forget, download, evict, fromCache }
}
