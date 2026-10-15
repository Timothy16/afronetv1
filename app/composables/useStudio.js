// app/composables/useStudio.js
//
// The developer's side of the state: the builds this account has made, the AI quota, and the
// undo stack the builder works against.
//
// The builds come from the server (`/api/studio/apps`) and are held in useState so every
// Studio screen reads one copy. Changes are applied here first and saved in the background —
// typing in the listing editor should not wait for a round trip — while the actions that have
// consequences for other people (publishing, withdrawing, shipping) are awaited, because the
// screen has to show what the server actually decided.
//
// Two rules here come straight from the developer guide, and both outlive this prototype:
//
//   1. A generation is never applied to a build on its own. The chat answers with a proposal;
//      applying it is a separate, deliberate act.
//   2. Changing a build invalidates its test result. An app that was tested, then edited, is
//      an untested app — so `testedAt` is cleared on every change, and the server refuses to
//      publish or ship a build that has not been tested since.

import { useToast } from 'vue-toastification'
import { todayISO } from '~/data/store'
import { aiQuota } from '~/data/studio'

/**
 * Edits waiting to be sent, and the timer that will send them, keyed by build.
 *
 * Module scope rather than `useState`, because a timer handle is not state to be transferred
 * to the browser — it is a live thing that belongs to the tab. Only the browser ever writes
 * here; on the server `updateDevAppSoon` sends immediately and never touches these.
 */
const pendingPatch = {}
const patchTimer = {}

export function useStudio() {
  // Publishing reaches into the store's catalogue, which is where these two sides meet.
  const { catalogue, loadCatalogue } = useAppLibrary()

  const devApps = useState('studio:apps', () => [])
  const devAppsLoaded = useState('studio:apps-loaded', () => false)
  const credits = useState('studio:credits', () => ({ ...aiQuota }))

  // The builder's undo stack, keyed by build id so two projects cannot share a history.
  const past = useState('studio:past', () => ({}))
  const future = useState('studio:future', () => ({}))

  // On the server this forwards the session cookie; in the browser it is $fetch.
  const apiFetch = useRequestFetch()

  const notify = (message, kind = 'info') => {
    if (!import.meta.client) return
    const toast = useToast()
    if (kind === 'success') toast.success(message)
    else if (kind === 'error') toast.error(message)
    else toast(message)
  }

  // --- loading ------------------------------------------------------------
  const loadDevApps = async (force = false) => {
    if (devAppsLoaded.value && !force) return
    try {
      const res = await apiFetch('/api/studio/apps')
      devApps.value = res?.data ?? []
      devAppsLoaded.value = true
    } catch {
      devAppsLoaded.value = false
    }
  }

  // --- reading ------------------------------------------------------------
  const findDevApp = (id) => devApps.value.find((a) => a.id === id)

  /**
   * How an app is actually doing, read from its store listing.
   *
   * A build carries its own `installs` and `rating`, written once when it was created and
   * never touched again. Studio was reading those, so a developer saw nothing while the store
   * page for the same app said two installs. The listing is where the real figures live,
   * because that is what a device reports against.
   *
   * Returns nulls for an app that has never been published, which is the honest answer rather
   * than zero — nobody has had the chance to install it.
   */
  const liveStats = (app) => {
    const listing = app?.storeAppId ? catalogue.value.find((a) => a.id === app.storeAppId) : null
    return {
      installs: listing?.installs ?? null,
      rating: listing?.ratingCount ? listing.rating : null,
      ratingCount: listing?.ratingCount ?? 0,
      liveVersion: listing?.version ?? null,
    }
  }

  /**
   * What has been changed on a published app but not yet shipped.
   *
   * Derived by comparing the build with its listing, rather than carried as a status. A status
   * only gets set by whatever code remembers to set it — and only one place did, so editing a
   * published app's name or description left it looking unchanged and there was no way to ship
   * the update at all. Comparing the two records cannot fall out of step with itself.
   *
   * Returns the names of what differs, so the screen can say which parts rather than just that
   * something did.
   */
  const unpublishedChanges = (app) => {
    if (!app?.storeAppId) return []
    const listing = catalogue.value.find((a) => a.id === app.storeAppId)
    if (!listing) return []

    const same = (a, b) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
    const changed = []

    if (app.name !== listing.name) changed.push('Name')
    if (app.tagline !== listing.tagline) changed.push('Short description')
    if (app.description !== listing.description) changed.push('Description')
    if (app.icon !== listing.icon) changed.push('Icon')
    if ((app.config?.tone ?? app.tone) !== listing.tone) changed.push('Theme')
    if (app.category !== listing.category) changed.push('Category')
    if ((app.pricingModel === 'paid' ? app.price : 0) !== listing.price) changed.push('Price')
    if (!same(app.features, listing.features)) changed.push('Feature highlights')

    return changed
  }

  const published = computed(() => devApps.value.filter((a) => a.status === 'published'))

  /** Everything that still needs the developer to do something. */
  const pipeline = computed(() => devApps.value.filter((a) => !['published', 'archived'].includes(a.status)))

  const creditsLeft = computed(() => Math.max(0, credits.value.limit - credits.value.used))

  // --- writing ------------------------------------------------------------
  const replaceLocal = (app) => {
    if (!app) return
    devApps.value = devApps.value.map((a) => (a.id === app.id ? app : a))
  }

  /**
   * Applies a change here, then saves it. The screens never wait: an edit that fails to save
   * says so rather than silently reverting what someone typed, because losing their words
   * would be worse than telling them to try again.
   */
  const sendPatch = (id, patch) =>
    apiFetch(`/api/studio/apps/${id}`, { method: 'PUT', body: patch }).catch(() => {
      notify('That change could not be saved. Check your connection and try again.', 'error')
    })

  const applyLocal = (id, patch) => {
    const next = { ...patch, updatedAt: todayISO() }
    devApps.value = devApps.value.map((a) => (a.id === id ? { ...a, ...next } : a))
    return next
  }

  /** Writes now. For a toggle, a status change, anything that is one deliberate action. */
  const updateDevApp = (id, patch) => {
    const next = applyLocal(id, patch)

    // Anything still buffered for this app goes with it, so a typed field cannot land after
    // a later toggle and overwrite it.
    const merged = { ...(pendingPatch[id] ?? {}), ...next }
    delete pendingPatch[id]
    clearTimeout(patchTimer[id])

    return sendPatch(id, merged)
  }

  /**
   * Writes once the typing stops.
   *
   * The screen updates immediately either way; what waits is the request. A name field was
   * sending one PUT per keystroke, which on a phone connection is dozens of requests for one
   * edit and no guarantee they arrive in the order they were typed.
   */
  const updateDevAppSoon = (id, patch) => {
    applyLocal(id, patch)
    if (!import.meta.client) return sendPatch(id, { ...patch, updatedAt: todayISO() })

    pendingPatch[id] = { ...(pendingPatch[id] ?? {}), ...patch, updatedAt: todayISO() }
    clearTimeout(patchTimer[id])
    patchTimer[id] = setTimeout(() => flushDevApp(id), 700)
  }

  /** Sends whatever is buffered now — on leaving a screen, or before anything that depends on it. */
  const flushDevApp = (id) => {
    clearTimeout(patchTimer[id])
    const patch = pendingPatch[id]
    if (!patch) return
    delete pendingPatch[id]
    return sendPatch(id, patch)
  }

  /**
   * Change the build itself. Clears the test result, because the thing that was tested no
   * longer exists, and moves a published app to "update ready" rather than editing what people
   * have already installed.
   */
  const setConfig = (id, patch, { trackHistory = true } = {}) => {
    const app = findDevApp(id)
    if (!app) return
    if (trackHistory) {
      past.value = { ...past.value, [id]: [...(past.value[id] ?? []), { ...app.config }] }
      future.value = { ...future.value, [id]: [] }
    }
    // A published app stays published while it is being changed. Moving it to another status
    // took it out of the published list and out of the figures, as though editing a description
    // had unpublished it. What is unshipped is worked out by comparing it with its listing.
    updateDevApp(id, {
      config: { ...app.config, ...patch },
      testedAt: '',
      status: ['published', 'archived'].includes(app.status) ? app.status : 'draft',
    })
  }

  const canUndo = (id) => Boolean((past.value[id] ?? []).length)
  const canRedo = (id) => Boolean((future.value[id] ?? []).length)

  const undo = (id) => {
    const app = findDevApp(id)
    const stack = past.value[id] ?? []
    if (!app || !stack.length) return
    future.value = { ...future.value, [id]: [{ ...app.config }, ...(future.value[id] ?? [])] }
    past.value = { ...past.value, [id]: stack.slice(0, -1) }
    updateDevApp(id, { config: stack[stack.length - 1], testedAt: '' })
  }

  const redo = (id) => {
    const app = findDevApp(id)
    const stack = future.value[id] ?? []
    if (!app || !stack.length) return
    past.value = { ...past.value, [id]: [...(past.value[id] ?? []), { ...app.config }] }
    future.value = { ...future.value, [id]: stack.slice(1) }
    updateDevApp(id, { config: stack[0], testedAt: '' })
  }

  // --- creating -----------------------------------------------------------
  /** The wizard sends its answers; the server decides what a new build looks like. */
  const createDevApp = async (answers) => {
    const res = await apiFetch('/api/studio/apps', { method: 'POST', body: answers })
    const app = res?.data
    if (app) devApps.value = [app, ...devApps.value]
    // The generation that just happened changed what is left, and the next screen says so.
    await loadQuota()
    return app
  }

  // --- the quota ----------------------------------------------------------
  // Read from the server, which is also what enforces it. The browser shows the number; it has
  // no say in it, because a count kept here is a suggestion and the API key is not.
  const loadQuota = async () => {
    try {
      const res = await apiFetch('/api/studio/quota')
      const q = res?.data
      if (q) credits.value = { used: q.monthUsed, limit: q.monthLimit, resets: q.resetsOn, costUsd: q.monthCostUsd }
    } catch {
      // Leave the last known figure. A quota that cannot be read is not a quota of zero.
    }
  }

  // --- testing ------------------------------------------------------------
  /**
   * Records a test run. Sizes are re-measured from the build, and a draft that passes becomes
   * ready to submit — that is the only way an app reaches the checklist.
   */
  // The size is measured on the server when the app is generated, and the test run does not
  // re-measure anything — it used to write a rounded copy back, which turned a real 0.015 MB
  // into 0 and then reported the app as weighing nothing.
  const recordTestRun = (id) => {
    const app = findDevApp(id)
    if (!app) return
    updateDevApp(id, {
      testedAt: todayISO(),
      status: app.status === 'draft' || app.status === 'testing' ? 'review_required' : app.status,
    })
  }

  // --- publishing ---------------------------------------------------------
  /**
   * Submit, check, publish — or send it back with the reason.
   *
   * This was five stages and four button presses, three of which incremented a number and did
   * nothing else: a progress bar for a review process that does not exist. What is left is the
   * one step that was always real, plus the automated checks, which now actually run.
   *
   * A human reviewer comes back when there are real developers publishing. The build record
   * still carries everything that needs — a rejected state, review comments to resolve — so
   * none of that has to be rebuilt.
   */
  const submitForReview = async (id) => {
    const app = findDevApp(id)
    if (!app) return

    updateDevApp(id, { status: 'in_review', reviewComments: app.reviewComments.filter((c) => !c.resolved) })

    try {
      const res = await apiFetch(`/api/studio/apps/${id}/publish`, { method: 'POST' })
      replaceLocal(res?.data?.build)

      const listing = res?.data?.listing
      if (listing) {
        const existing = catalogue.value.some((a) => a.id === listing.id)
        catalogue.value = existing
          ? catalogue.value.map((a) => (a.id === listing.id ? listing : a))
          : [listing, ...catalogue.value]
      }

      notify(`${app.name} is live in the App Store.`, 'success')
      return listing?.id ?? ''
    } catch (e) {
      // A failed check is not an error to shrug at — it is a decision, with reasons, and the
      // developer reads them in the same place a reviewer's comments would appear.
      const findings = e?.data?.data?.findings ?? []
      updateDevApp(id, {
        status: 'rejected',
        reviewComments: [
          ...findings.map((f, i) => ({
            id: `check-${i}`,
            area: f.fatal ? 'Automated check' : 'Worth looking at',
            body: `${f.message}${f.file ? ` (${f.file})` : ''}`,
            date: todayISO(),
            resolved: false,
          })),
          ...app.reviewComments.filter((c) => !c.resolved),
        ],
      })
      notify(e?.data?.message || 'That app could not be published.', 'error')
      return ''
    }
  }

  const resolveComment = (id, commentId, resolved) => {
    const app = findDevApp(id)
    if (!app) return
    updateDevApp(id, {
      reviewComments: app.reviewComments.map((c) => (c.id === commentId ? { ...c, resolved } : c)),
    })
  }

  // --- taking it down -----------------------------------------------------
  /**
   * Unpublishing or archiving reaches the store too, or the listing would stay downloadable
   * after the developer thought they had pulled it. The listing is suspended rather than
   * deleted: people who already have the app keep it, which is what the confirmation promises.
   */
  /** Brings an archived app back to the list it was taken out of. */
  const restore = async (id) => {
    const app = findDevApp(id)
    if (!app) return
    try {
      const res = await apiFetch(`/api/studio/apps/${id}/restore`, { method: 'POST' })
      replaceLocal(res?.data)
      notify(`${app.name} restored. It is not back in the store until you publish it.`, 'success')
    } catch (e) {
      notify(e?.data?.message || 'That app could not be restored.', 'error')
    }
  }

  const withdraw = async (id, kind) => {
    const app = findDevApp(id)
    if (!app) return
    try {
      const res = await apiFetch(`/api/studio/apps/${id}/withdraw`, { method: 'POST', body: { kind } })
      replaceLocal(res?.data)
      await loadCatalogue(true)
      notify(kind === 'unpublish' ? `${app.name} unpublished.` : `${app.name} archived.`, 'success')
    } catch {
      notify('That could not be saved. Check your connection and try again.', 'error')
    }
  }

  // --- shipping an update -------------------------------------------------
  const shipUpdate = async (id, notes, mandatory) => {
    const app = findDevApp(id)
    if (!app?.storeAppId) return ''
    try {
      const res = await apiFetch(`/api/studio/apps/${id}/ship`, {
        method: 'POST',
        body: { notes, mandatory },
      })
      replaceLocal(res?.data?.build)
      await loadCatalogue(true)
      return res?.data?.version ?? ''
    } catch (e) {
      notify(e?.data?.message || 'That update could not be shipped.', 'error')
      return ''
    }
  }

  return {
    devApps,
    devAppsLoaded,
    credits,
    creditsLeft,
    published,
    pipeline,
    loadDevApps,
    findDevApp,
    liveStats,
    unpublishedChanges,
    createDevApp,
    updateDevApp,
    updateDevAppSoon,
    flushDevApp,
    setConfig,
    canUndo,
    canRedo,
    undo,
    redo,
    loadQuota,
    recordTestRun,
    submitForReview,
    resolveComment,
    withdraw,
    restore,
    shipUpdate,
    notify,
  }
}
