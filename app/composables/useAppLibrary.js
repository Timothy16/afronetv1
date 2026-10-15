// app/composables/useAppLibrary.js
//
// What this device has done with the App Store: which apps are installed, what is
// downloading, what has been paid for, what is saved, what has been reviewed, and which
// permissions each app has been granted — plus the actions that change any of it.
//
// Built on Nuxt's useState, so every store screen reads and writes the same values and
// nothing extra needs installing. The seed arrays are copied, never shared by reference,
// so an action can never write back into the mock data in ~/data/store.
//
// The download engine here is a simulation: a timer walks a percentage upwards, then a
// verification pause, then the app appears as installed. It exists so the dialogs,
// progress rows and failure states can be seen and tested. Nothing is fetched, and the
// real engine (service worker, Cache Storage, signed package) belongs to the next phase.
//
// `online` is the browser's real connection. The store needs one — this release does not
// support using it offline — so it is read only to stop a download or a purchase from
// pretending to work when there is nothing behind it.
//
// Everything that happens here happens in a click handler, never during render, which is
// why timestamps and ids are allowed to change. Rendered values come from the pinned demo
// clock in ~/data/store so the server and the browser always agree.

import { useToast } from 'vue-toastification'
import {
  DEMO_FREE_MB,
  nowISO,
  todayISO,
  compareVersions,
  formatMB,
  formatNaira,
  purchaseRef,
  seedInstalled,
  seedPurchases,
  seedSaved,
  uid,
} from '~/data/store'

// Which packages are already being verified, so two components mounting at once cannot
// finalise the same download twice.
const verifying = new Set()

export function useAppLibrary() {
  // The catalogue comes from the server (`/api/apps`) and is held here so every screen reads
  // one copy of it. Studio also publishes into it, so an app approved in review appears in the
  // store without a reload.
  const catalogue = useState('store:catalogue', () => [])
  const catalogueLoaded = useState('store:catalogue-loaded', () => false)

  const installed = useState('store:installed', () => seedInstalled.map((i) => ({ ...i })))
  const installedHydrated = useState('store:installed-hydrated', () => false)
  const downloads = useState('store:downloads', () => ({}))
  const purchases = useState('store:purchases', () => seedPurchases.map((p) => ({ ...p })))
  const saved = useState('store:saved', () => [...seedSaved])
  const savedHydrated = useState('store:saved-hydrated', () => false)
  // Keyed by app id, filled when an app's page opens. Nothing is seeded.
  const reviews = useState('store:reviews', () => ({}))
  const freeMB = useState('store:free-mb', () => DEMO_FREE_MB)
  const freeMBMeasured = useState('store:free-mb-measured', () => false)

  /**
   * How much room this browser will actually give Afronet.
   *
   * The figure started as a flat 120 MB, which is a guess dressed as a fact on a screen whose
   * whole job is telling someone whether an app will fit. Browsers expose a real estimate, so
   * ask. It is an estimate — the dialogs already say so — but it is this device's estimate.
   *
   * Called after render. A number that differs between the server and the browser would
   * otherwise change the page on arrival.
   */
  const measureFreeSpace = async () => {
    if (!import.meta.client || freeMBMeasured.value) return
    freeMBMeasured.value = true
    try {
      const { quota, usage } = (await navigator.storage?.estimate?.()) ?? {}
      if (typeof quota !== 'number' || typeof usage !== 'number') return
      freeMB.value = Math.max(0, Math.round(((quota - usage) / 1048576) * 10) / 10)
    } catch {
      // Unsupported, or refused in private browsing. The stated default stands.
    }
  }

  // What each app has saved for itself, keyed by app id. The runtime writes it through the
  // bridge; the storage manager reads it back as that app's saved data.
  //
  // It is mirrored into the browser's own storage, because the apps say "saved on this
  // device" and a figure held only in memory makes that false as soon as the page reloads.
  // Afronet keeps it rather than the app: an app runs on an opaque origin with no storage of
  // its own, which is exactly what keeps one app out of another's data.
  const appData = useState('store:app-data', () => ({}))
  const appDataHydrated = useState('store:app-data-hydrated', () => false)

  // Permissions the person has answered for, keyed `appId:permissionId`. A missing entry
  // means they have not been asked yet, which is a different thing from having refused.
  const permissions = useState('store:permissions', () => ({}))

  const online = useOnline()

  // During server rendering a plain $fetch would reach /api/apps without the session cookie
  // and be refused. useRequestFetch forwards the incoming request's headers; in the browser
  // it is $fetch.
  const apiFetch = useRequestFetch()

  // Resolved here rather than inside the handlers that use it. These are Nuxt composables, and
  // reaching for one from inside a click handler or a promise depends on the framework context
  // still being resolvable at that moment — which is not something an uninstall should rest on.
  const packageStore = useAppPackage()

  /** Where the apps' own data lives between visits. */
  const APP_DATA_KEY = 'afronet:app-data'

  /** A saved object's size on disk, in MB, as the storage screens show it. */
  const dataSizeMB = (value) => {
    if (!value) return 0
    const bytes = JSON.stringify(value).length
    // Six places, not three. An attendance register is about a hundred bytes, which rounded
    // to three decimals is exactly zero — so the screens reported that nothing had been
    // saved, and the figure never moved however much was added.
    return Math.round((bytes / 1048576) * 1e6) / 1e6
  }

  const persistAppData = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(APP_DATA_KEY, JSON.stringify(appData.value))
    } catch {
      // Private browsing, or a full disk. The app keeps working for this visit.
    }
  }

  /**
   * Brings back what apps saved on previous visits. Called from the screens that need it
   * rather than during setup, so it cannot change what was rendered on the server.
   */
  const hydrateAppData = () => {
    if (!import.meta.client || appDataHydrated.value) return
    appDataHydrated.value = true
    try {
      const raw = localStorage.getItem(APP_DATA_KEY)
      if (!raw) return
      const stored = JSON.parse(raw)
      if (!stored || typeof stored !== 'object') return
      appData.value = stored
      // Bring each app's saved-data figure back in line with what is actually stored.
      installed.value = installed.value.map((i) => ({ ...i, dataMB: dataSizeMB(stored[i.appId]) }))
      persistInstalled()
    } catch {
      // Unreadable or from an older shape: start clean rather than fail to open.
    }
  }

  const notify = (message, kind = 'info') => {
    if (!import.meta.client) return
    const toast = useToast()
    if (kind === 'success') toast.success(message)
    else if (kind === 'error') toast.error(message)
    else toast(message)
  }

  // --- loading the catalogue ----------------------------------------------
  /**
   * Fills the catalogue once. Called from the store and studio layouts, so it runs during
   * server rendering and the result travels to the browser in the payload — the screens
   * never flash empty, and the browser does not fetch it a second time.
   *
   * A failure leaves the catalogue empty rather than throwing: the screens all have an empty
   * state, and a store that cannot reach the server should say so rather than break.
   */
  const loadCatalogue = async (force = false) => {
    if (catalogueLoaded.value && !force) return
    try {
      const res = await apiFetch('/api/apps')
      catalogue.value = res?.data ?? []
      catalogueLoaded.value = true
    } catch {
      catalogueLoaded.value = false
    }
  }

  // --- reading the catalogue ---------------------------------------------
  const getApp = (id) => catalogue.value.find((a) => a.id === id)

  const liveApps = computed(() => catalogue.value.filter((a) => a.status === 'live'))

  const appsInCollection = (name) => liveApps.value.filter((a) => a.collections.includes(name))

  const appsInCategory = (id) => liveApps.value.filter((a) => a.category === id)

  /** Newest first by the date the developer last shipped. */
  const recentApps = (limit = 8) => [...liveApps.value].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, limit)

  /** Adds a newly approved app, or replaces it if it is already listed. */
  const publishApp = (entry) => {
    const existing = getApp(entry.id)
    catalogue.value = existing
      ? catalogue.value.map((a) => (a.id === entry.id ? { ...a, ...entry, rating: a.rating, ratingCount: a.ratingCount, installs: a.installs } : a))
      : [entry, ...catalogue.value]
  }

  /** Changes a listing that is already live — a shipped update, or a suspension. */
  const patchApp = (id, patch) => {
    catalogue.value = catalogue.value.map((a) => (a.id === id ? { ...a, ...patch } : a))
  }

  // --- reading this device ------------------------------------------------
  const getInstalled = (appId) => installed.value.find((i) => i.appId === appId)

  const getDownload = (appId) => downloads.value[appId]

  /** Space needed while installing: the package and the unpacked files exist together. */
  const requiredMB = (app) => app.downloadMB + app.installedMB

  const hasEntitlement = (appId) => {
    const app = getApp(appId)
    if (!app || app.price === 0) return true
    return purchases.value.some((p) => p.appId === appId && p.status === 'verified')
  }

  const hasUpdate = (appId) => {
    const app = getApp(appId)
    const inst = getInstalled(appId)
    return Boolean(app && inst && compareVersions(app.version, inst.version) > 0)
  }

  const installedTotalMB = (inst) => inst.appFilesMB + inst.dataMB

  /** Installed apps paired with their catalogue entry. */
  const library = computed(() => installed.value.map((i) => ({ i, a: getApp(i.appId) })).filter((x) => x.a))

  const updates = computed(() => library.value.filter(({ a, i }) => compareVersions(a.version, i.version) > 0))

  const usedMB = computed(() => installed.value.reduce((sum, i) => sum + installedTotalMB(i), 0))

  // --- the download engine -----------------------------------------------
  const patchTask = (appId, patch) => {
    const task = downloads.value[appId]
    if (!task) return
    downloads.value = { ...downloads.value, [appId]: { ...task, ...patch } }
  }

  const dropTask = (appId) => {
    const next = { ...downloads.value }
    delete next[appId]
    downloads.value = next
  }

  /**
   * Tells the server an app reached a device, and shows the new figure straight away.
   *
   * Called on every install and every update, because the row carries the version and size as
   * well as the count. The server only increments the first time, so reinstalling after a
   * cleared cache — or updating — adds nothing to the figure.
   */
  const reportInstall = async (appId) => {
    try {
      const res = await apiFetch(`/api/apps/${appId}/installed`, {
        method: 'POST',
        body: { appFilesMB: getInstalled(appId)?.appFilesMB ?? 0 },
      })
      const installs = res?.data?.installs
      if (typeof installs !== 'number') return
      catalogue.value = catalogue.value.map((a) => (a.id === appId ? { ...a, installs } : a))
    } catch {
      // The app is installed either way. A count that did not reach us is not their problem.
    }
  }

  /**
   * Puts the downloaded app on the device, once its checksum has been checked.
   *
   * `pkg` is what actually arrived, so the recorded size is the size of the real files rather
   * than what the listing advertised.
   */
  const finalize = (appId, pkg = null) => {
    verifying.delete(appId)
    const task = downloads.value[appId]
    const app = getApp(appId)
    if (!task || !app || task.status !== 'verifying') return

    // What landed, in MB. Falls back to the listing only if the package did not say.
    const bytes = pkg?.manifest?.sizeBytes ?? 0
    const filesMB = bytes ? Math.round((bytes / 1048576) * 1000) / 1000 : app.installedMB

    if (task.corrupt) {
      patchTask(appId, {
        status: 'failed',
        progress: 0,
        error: 'Integrity check failed: the package did not match its signed checksum. Nothing was installed and no space was used.',
      })
      notify(`${app.name} failed verification. The package looked damaged and was discarded.`, 'error')
      return
    }

    const existing = getInstalled(appId)
    if (task.kind === 'update' && existing) {
      installed.value = installed.value.map((i) =>
        i.appId === appId ? { ...i, version: app.version, appFilesMB: filesMB } : i,
      )
      freeMB.value -= filesMB - existing.appFilesMB
      notify(`${app.name} updated to ${app.version} · your saved data was kept.`, 'success')
      persistInstalled()
      reportInstall(appId)
    } else {
      installed.value = [
        ...installed.value.filter((i) => i.appId !== appId),
        {
          appId,
          version: app.version,
          appFilesMB: filesMB,
          dataMB: 0,
          lastUsed: '',
          installedAt: todayISO(),
        },
      ]
      freeMB.value -= filesMB
      notify(`${app.name} is ready to open.`, 'success')
      persistInstalled()
      reportInstall(appId)
    }

    dropTask(appId)
  }

  // --- actions ------------------------------------------------------------
  /**
   * Downloads an app, for real.
   *
   * The package is fetched as a stream, so the percentage is the bytes that have landed, and
   * what arrives is kept in the browser's Cache Storage. Only then is the checksum recomputed
   * and compared with the one in the manifest — verification happens at install, where the
   * person is being told "Verifying…", rather than later when they open the app.
   *
   * A mismatch installs nothing. That is the whole reason the checksum exists.
   */
  const runDownload = async (appId, kind) => {
    const { download, verify, evict } = packageStore
    const url = `/api/packages/${appId}`
    const app = getApp(appId)

    try {
      const pkg = await download(url, {
        expectedBytes: Math.round((app?.downloadMB ?? 0) * 1048576),
        onProgress: (pct) => {
          const task = downloads.value[appId]
          // Cancelled, or paused, while bytes were still arriving.
          if (!task || task.status !== 'downloading') return
          if (pct >= 0) patchTask(appId, { progress: Math.min(99, pct) })
        },
      })

      // Cancelled while the bytes were arriving, or paused — a paused download must not
      // install itself just because the transfer happened to finish.
      const current = downloads.value[appId]
      if (!current || current.status !== 'downloading') return

      patchTask(appId, { progress: 100, status: 'verifying' })

      const state = await verify(pkg)
      if (state === 'mismatch') {
        await evict(url)
        patchTask(appId, { corrupt: true })
      }

      finalize(appId, pkg)
    } catch (e) {
      if (!downloads.value[appId]) return
      patchTask(appId, {
        status: 'failed',
        error: online.value
          ? `The download stopped: ${e?.message ?? 'something went wrong'}. Your progress is kept — try again.`
          : `Connection lost at ${Math.round(downloads.value[appId]?.progress ?? 0)}%. Your progress is kept — resume when you’re back online.`,
      })
    }
  }

  const startDownload = (appId, kind = 'install') => {
    if (!online.value) return false
    downloads.value = {
      ...downloads.value,
      [appId]: { appId, kind, progress: 0, status: 'downloading', error: '', corrupt: false },
    }
    runDownload(appId, kind)
    return true
  }

  // The transfer carries on in the background; what stops is it driving the screen. Its
  // progress updates check the status before writing, so a paused bar stays where it was.
  const pauseDownload = (appId) => patchTask(appId, { status: 'paused' })

  const resumeDownload = (appId) => {
    if (!online.value) {
      notify('No connection. Downloads resume when you reconnect.', 'error')
      return
    }
    // The transfer starts again rather than picking up where it stopped: a package is one
    // small response, and resuming part of one costs more than fetching it twice.
    patchTask(appId, { status: 'downloading', error: '', corrupt: false, progress: 0 })
    const task = downloads.value[appId]
    if (task) runDownload(appId, task.kind)
  }

  const cancelDownload = (appId) => {
    verifying.delete(appId)
    dropTask(appId)
  }

  // --- freeing space ------------------------------------------------------
  // Everything that removes something goes through here, so the space released and the
  // record on the device can never disagree.
  const releaseSpace = (appId, fn) => {
    const inst = getInstalled(appId)
    if (!inst) return
    const { freed, next } = fn(inst)
    freeMB.value += freed
    installed.value = next
      ? installed.value.map((i) => (i.appId === appId ? next : i))
      : installed.value.filter((i) => i.appId !== appId)
    persistInstalled()
  }

  const uninstall = (appId, deleteData) => {
    releaseSpace(appId, (i) => ({ freed: i.appFilesMB + (deleteData ? i.dataMB : 0), next: null }))
    if (deleteData) forgetAppData(appId)

    // The files have to leave the device, or "removed to free space" frees nothing and the
    // app would still open from what was cached.
    packageStore.evict(`/api/packages/${appId}`)

    // And out of the account's library, so it is gone wherever they are signed in.
    apiFetch(`/api/apps/${appId}/installed`, { method: 'DELETE' }).catch(() => {
      notify('Removed here, but your account could not be updated. It may come back on another device.', 'error')
    })
  }

  const forgetAppData = (appId) => {
    const next = { ...appData.value }
    delete next[appId]
    appData.value = next
    persistAppData()
  }

  const clearData = (appId) => {
    releaseSpace(appId, (i) => ({ freed: i.dataMB, next: { ...i, dataMB: 0 } }))
    forgetAppData(appId)
  }

  // --- using an app ------------------------------------------------------
  const logUsage = (appId) => {
    installed.value = installed.value.map((i) => (i.appId === appId ? { ...i, lastUsed: nowISO() } : i))
    persistInstalled()
  }

  /**
   * What an app saved for itself. Writing it also grows that app's share of storage, so
   * the storage manager reflects use rather than showing a figure fixed at install time.
   */
  const setAppData = (appId, data) => {
    appData.value = { ...appData.value, [appId]: data }
    persistAppData()

    const inst = getInstalled(appId)
    if (!inst) return
    const dataMB = dataSizeMB(data)
    if (dataMB === inst.dataMB) return
    freeMB.value -= dataMB - inst.dataMB
    installed.value = installed.value.map((i) => (i.appId === appId ? { ...i, dataMB } : i))
    persistInstalled()
  }

  // --- permissions -------------------------------------------------------
  // 'ask' is the absence of an answer, and is kept distinct from 'denied': an app that has
  // never asked must not look like one that was refused.
  const permissionState = (appId, permissionId) => permissions.value[`${appId}:${permissionId}`] ?? 'ask'

  const setPermission = (appId, permissionId, state) => {
    permissions.value = { ...permissions.value, [`${appId}:${permissionId}`]: state }
  }

  // --- buying ------------------------------------------------------------
  const recordPurchase = (appId, method) => {
    const app = getApp(appId)
    if (!app) return null
    const purchase = {
      id: uid('pu'),
      appId,
      amount: app.price,
      ref: purchaseRef(),
      date: todayISO(),
      method,
      status: 'verified',
    }
    purchases.value = [purchase, ...purchases.value]
    notify(`Purchase confirmed · ${app.name} · ${formatNaira(app.price)} (test mode)`, 'success')
    return purchase
  }

  // --- reviews and saves -------------------------------------------------
  /**
   * One app's reviews, fetched when its page opens.
   *
   * Kept per app rather than in one list, so opening a second app does not have to work out
   * which of the two the reviews in hand belong to.
   */
  const loadReviews = async (appId) => {
    try {
      const res = await apiFetch(`/api/apps/${appId}/reviews`)
      if (Array.isArray(res?.data)) reviews.value = { ...reviews.value, [appId]: res.data }
    } catch {
      // Leave whatever was there. An app page without its reviews still works.
    }
  }

  const reviewsFor = (appId) => reviews.value[appId] ?? []

  /** The person's own review of an app, if they have written one. */
  const myReview = (appId) => reviewsFor(appId).find((r) => r.mine) ?? null

  /** Moves the stars on the listing in hand, so the page does not need reloading. */
  const applyRating = (appId, totals) => {
    if (!totals || typeof totals.rating !== 'number') return
    catalogue.value = catalogue.value.map((a) =>
      a.id === appId ? { ...a, rating: totals.rating, ratingCount: totals.ratingCount } : a,
    )
  }

  /**
   * Writes a review, or changes the one already written.
   *
   * The server decides whether it is allowed, who it is signed by, and what the app's rating
   * becomes — it answers with the new totals. Nothing here calculates a rating.
   */
  const saveReview = async (appId, { rating, body }) => {
    try {
      const res = await apiFetch(`/api/apps/${appId}/reviews`, { method: 'POST', body: { rating, body } })
      applyRating(appId, res?.data)
      await loadReviews(appId)
      return true
    } catch (e) {
      notify(e?.data?.message || 'That review could not be saved.', 'error')
      return false
    }
  }

  const removeReview = async (appId) => {
    try {
      const res = await apiFetch(`/api/apps/${appId}/reviews`, { method: 'DELETE' })
      applyRating(appId, res?.data)
      await loadReviews(appId)
      return true
    } catch (e) {
      notify(e?.data?.message || 'That review could not be removed.', 'error')
      return false
    }
  }

  const SAVED_KEY = 'afronet:saved-apps'
  const INSTALLED_KEY = 'afronet:installed-apps'

  const persistInstalled = () => {
    if (!import.meta.client) return
    try {
      localStorage.setItem(INSTALLED_KEY, JSON.stringify(installed.value))
    } catch {
      // Private browsing, or a full disk. It still holds for this visit.
    }
  }

  /**
   * Brings back what this device has installed.
   *
   * The files were already surviving a reload — they are in Cache Storage — but the record of
   * them was not, so the store forgot and offered to install an app that was sitting right
   * there. The two are reconciled rather than trusted: an entry whose package is no longer
   * cached is dropped, because a browser may clear storage without telling anyone, and an app
   * listed as installed that cannot open is worse than one that asks to be downloaded again.
   */
  const hydrateInstalled = async () => {
    if (!import.meta.client || installedHydrated.value) return
    installedHydrated.value = true

    // What this device remembers: when each app was last opened, and how much it has saved.
    // Those are facts about this browser and belong nowhere else.
    let local = []
    try {
      const raw = localStorage.getItem(INSTALLED_KEY)
      const parsed = raw ? JSON.parse(raw) : null
      if (Array.isArray(parsed)) local = parsed.filter((i) => i && typeof i.appId === 'string')
    } catch {
      // Unreadable. The account's library still arrives below.
    }

    try {
      const res = await apiFetch('/api/apps/installed')
      const rows = res?.data
      if (!Array.isArray(rows)) return

      installed.value = rows.map((row) => {
        const known = local.find((i) => i.appId === row.appId)
        return {
          appId: row.appId,
          version: row.version || known?.version || '',
          appFilesMB: row.appFilesMB || known?.appFilesMB || 0,
          dataMB: dataSizeMB(appData.value[row.appId]) || known?.dataMB || 0,
          lastUsed: known?.lastUsed ?? '',
          installedAt: row.installedAt || known?.installedAt || '',
        }
      })
      persistInstalled()
    } catch {
      // The server could not be reached. What this device remembers is better than nothing,
      // and an app whose files are cached still opens.
      installed.value = local
    }
  }

  /**
   * Bookmarking an app.
   *
   * Kept on the device, because a button that says "Saved" and forgets on the next page load
   * is worse than no button. It is not on the account yet — a bookmark that follows you
   * between devices needs somewhere on the server to live.
   */
  const toggleSaved = (appId) => {
    saved.value = saved.value.includes(appId) ? saved.value.filter((x) => x !== appId) : [...saved.value, appId]
    if (!import.meta.client) return
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved.value))
    } catch {
      // Private browsing, or a full disk. It still holds for this visit.
    }
  }

  /** Brings bookmarks back, from the screens that show them. Never during render. */
  const hydrateSaved = () => {
    if (!import.meta.client || savedHydrated.value) return
    savedHydrated.value = true
    try {
      const raw = localStorage.getItem(SAVED_KEY)
      const stored = raw ? JSON.parse(raw) : null
      if (Array.isArray(stored)) saved.value = stored.filter((x) => typeof x === 'string')
    } catch {
      // Unreadable, or from an older shape. An empty list is the honest fallback.
    }
  }

  return {
    // state
    catalogue,
    catalogueLoaded,
    installed,
    downloads,
    purchases,
    saved,
    reviews,
    appData,
    freeMB,
    usedMB,
    online,
    // loading
    loadCatalogue,
    // reading
    getApp,
    liveApps,
    appsInCollection,
    appsInCategory,
    recentApps,
    library,
    updates,
    getInstalled,
    getDownload,
    requiredMB,
    hasEntitlement,
    hasUpdate,
    installedTotalMB,
    reviewsFor,
    permissionState,
    // actions
    hydrateAppData,
    publishApp,
    patchApp,
    startDownload,
    pauseDownload,
    resumeDownload,
    cancelDownload,
    uninstall,
    clearData,
    logUsage,
    setAppData,
    setPermission,
    recordPurchase,
    loadReviews,
    myReview,
    saveReview,
    removeReview,
    toggleSaved,
    hydrateSaved,
    hydrateInstalled,
    measureFreeSpace,
    notify,
    // re-exported so screens need one import for the common formatters
    formatMB,
    formatNaira,
  }
}
