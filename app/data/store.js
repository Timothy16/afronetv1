// app/data/store.js
//
// The App Store catalogue, the copy that goes with it, and the helpers that read it.
//
// Mock data for the UI phase: no app here is real and no download happens. The shapes
// mirror the package format in the developer guide (manifest fields: id, version, size,
// permissions, offline level) so the dynamic phase can swap the seed arrays for the API
// without touching the screens.
//
// Two rules this file exists to keep:
//   1. Every colour is a palette token name, never a hex of its own. Components map a
//      tone to the project's hex values, so a new app can never introduce a new colour.
//   2. Nothing reads the clock while rendering. SSR renders on the server and again in the
//      browser, and a clock read in both places disagrees between them. The functions below
//      are for event handlers — a download finishing, a test being run — never for render.

/**
 * Now, and today, as a record stores them.
 *
 * These were pinned to a fixed date so the server and the browser could not disagree. The
 * pinning outlived its purpose: everything published was stamped 12 October whatever day it
 * actually was, and two updates shipped an hour apart looked simultaneous.
 *
 * Safe because every caller is an action someone took, not something being drawn. Anything
 * rendered reads a date that was already stored.
 */
export const nowISO = () => new Date().toISOString()

export const todayISO = () => new Date().toISOString().slice(0, 10)

/** Space the simulated device has left for Afronet, in MB. */
export const DEMO_FREE_MB = 120

// Labels for an offline release that does not exist yet. They described `offline` and
// `worksOffline` on a listing, and those fields are gone too — a default of "works offline"
// on every app was the untested claim the guide warns about. They come back together.

// --- categories -----------------------------------------------------------
export const categories = [
  { id: 'education', name: 'Education', blurb: 'Past questions, flashcards and revision tools', icon: 'fa-book-open', collections: ['Exam season essentials', 'Learn a language'] },
  { id: 'productivity', name: 'Productivity', blurb: 'Timetables, notes and focus tools', icon: 'fa-calendar-days', collections: ['Plan your semester', 'Lecture companions'] },
  { id: 'finance', name: 'Finance & calculators', blurb: 'Budgets, GPA and unit calculators', icon: 'fa-calculator', collections: ['Stretch your allowance'] },
  { id: 'games', name: 'Games', blurb: 'Light games that teach something', icon: 'fa-gamepad', collections: ['Learn while you play'] },
  { id: 'campus', name: 'Campus life', blurb: 'Maps, directories and campus radio', icon: 'fa-map', collections: ['New to campus'] },
  { id: 'health', name: 'Health & wellbeing', blurb: 'Breathing, sleep and mood check-ins', icon: 'fa-heart-pulse', collections: ['Exam stress kit'] },
  { id: 'creativity', name: 'Creativity', blurb: 'Sketching, writing and design', icon: 'fa-palette', collections: ['Make something'] },
  { id: 'utilities', name: 'Utilities', blurb: 'Small tools that just work', icon: 'fa-wrench', collections: ['Under 5 MB'] },
]

export function findCategory(id) {
  return categories.find((c) => c.id === id)
}

// --- permission wording ---------------------------------------------------
// Kept on the client because Studio builds a listing from a build when an app is approved.
// It moves to the server with the publishing endpoint.
const storage = { id: 'storage', label: 'Save data on this device', reason: 'Keeps your progress and settings so they are available without internet.' }
const network = { id: 'network', label: 'Internet access', reason: 'Needed only for the features listed under “Needs internet”.' }
const notifications = { id: 'notifications', label: 'Notifications', reason: 'Reminds you about study sessions you scheduled. You can turn this off.' }
const microphone = { id: 'microphone', label: 'Microphone', reason: 'Records lectures only when you press Record.' }
const images = { id: 'images', label: 'Choose images', reason: 'Lets you attach photos you pick. The app cannot browse your gallery.' }

/** So a newly published app declares the same permission wording as every other. */
export const permissionCatalogue = { storage, network, notifications, microphone, images }

// The catalogue itself lives in the database. The store reads it through useAppLibrary, which
// fetches /api/apps. Nothing is seeded: every listing is an app a developer generated and
// published, so an empty store means nobody has published yet.

// --- what this device already has ----------------------------------------
// Timestamps carry an explicit Z. Without it the server and the browser would read the
// same string in different time zones and the rendered "used 2 days ago" would disagree.
//
// An installed app is two figures: its own files, and whatever it has saved for itself.
// Two of these are deliberately behind the catalogue, so the Updates tab has something in
// it on a first run: Kobo Budget has an ordinary update waiting, LectureNotes a required
// security one. LectureNotes also asks for the microphone, which is the only permission
// the runtime has to stop and ask about.
// Nothing is installed, purchased or saved until this device does it. These were four
// installed apps, two purchases and two bookmarks for apps that no longer exist — phantom
// entries in My Apps and Storage, claiming space for files that were never downloaded.
export const seedInstalled = []
export const seedPurchases = []
export const seedSaved = []

// Reviews live in the database now and are fetched per app when its page opens. There were
// eight stand-ins here, all for apps that no longer exist.

// The signed-in person comes from the session — see useStoreUser. There was a mock one here
// called Amara Okafor, which meant Studio greeted every developer by somebody else's name.

// --- navigation -----------------------------------------------------------
export const storeNav = [
  { to: '/store', label: 'Home', icon: 'fa-house', exact: true },
  { to: '/store/search', label: 'Discover', icon: 'fa-magnifying-glass' },
  { to: '/store/categories', label: 'Categories', icon: 'fa-shapes' },
  { to: '/store/my-apps', label: 'My Apps', icon: 'fa-cubes' },
  { to: '/store/storage', label: 'Storage', icon: 'fa-hard-drive' },
]

// --- copy that more than one screen uses ---------------------------------
export const storeCopy = {
  demoNote: 'Ratings and reviews are not collected yet. Everything else here is real.',
  sandboxNote: 'Runs in Afronet’s sandbox — it can’t see your account or other apps’ data.',
  storageEstimate: 'Storage is a browser estimate, not an exact device reading.',
  needsConnection: 'Afronet Apps needs a connection in this release. Using apps offline comes later.',
}

// Reading the catalogue lives in useAppLibrary, not here: Studio publishes into it, so it
// has to be reactive state rather than this array.

// --- formatting -----------------------------------------------------------
// All hand-rolled. Intl resolves against a different locale on the server than in the
// browser, which shows up as a hydration mismatch on every price and size on the page.

function thousands(n) {
  const s = String(n)
  let out = ''
  for (let i = 0; i < s.length; i += 1) {
    out += s[i]
    const left = s.length - 1 - i
    if (left > 0 && left % 3 === 0) out += ','
  }
  return out
}

export function formatMB(mb) {
  const n = Number(mb) || 0
  if (n >= 1024) return `${Math.round((n / 1024) * 10) / 10} GB`
  if (n >= 1) return `${Math.round(n * 10) / 10} MB`

  const kb = n * 1024
  if (kb >= 10) return `${Math.round(kb)} KB`
  if (kb >= 1) return `${Math.round(kb * 10) / 10} KB`
  // A few hundred bytes is a real amount of saved work. Rounding it to "0 KB" told someone
  // their register had not been kept.
  if (n > 0) return 'under 1 KB'
  return '0 KB'
}

export function formatNaira(amount) {
  const n = Number(amount) || 0
  return `${n < 0 ? '−' : ''}₦${thousands(Math.round(Math.abs(n)))}`
}

export function compact(n) {
  const v = Number(n) || 0
  if (v < 1000) return String(v)
  const k = v / 1000
  return `${v >= 10000 ? Math.round(k) : Math.round(k * 10) / 10}k`
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** '2026-09-28' -> '28 Sep 2026'. Reads the string, so no time zone is involved. */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''))
  if (!m) return String(iso || '')
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}`
}

/**
 * How long ago something happened.
 *
 * Reads the real clock, which is safe here because the only things it is ever called on —
 * when an app was last opened — belong to this device and are read back after the page has
 * rendered. Nothing on the server has them to draw.
 */
export function timeAgo(iso, now = Date.now()) {
  const then = Date.parse(String(iso || ''))
  if (!Number.isFinite(then)) return ''
  const mins = Math.round((now - then) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} ${mins === 1 ? 'minute' : 'minutes'} ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} ${days === 1 ? 'day' : 'days'} ago`
  const months = Math.round(days / 30)
  return `${months} ${months === 1 ? 'month' : 'months'} ago`
}

export function compareVersions(a, b) {
  const pa = String(a || '').split('.').map(Number)
  const pb = String(b || '').split('.').map(Number)
  for (let i = 0; i < 3; i += 1) {
    if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0)
  }
  return 0
}

// --- search ---------------------------------------------------------------
// Matches on everything a person might type: the name, what the app does, its category,
// its maker, its tags and its feature list. If nothing matches, one spelling correction
// is attempted against the catalogue's own vocabulary before giving up.

function levenshtein(a, b) {
  const dp = Array.from({ length: a.length + 1 }, (row, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j += 1) dp[0][j] = j
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return dp[a.length][b.length]
}

function haystack(app) {
  return [app.name, app.tagline, app.category, app.creatorName, ...app.tags, ...app.features].join(' ').toLowerCase()
}

export function searchApps(apps, query) {
  const q = String(query || '').trim().toLowerCase()
  if (!q) return { results: apps, correctedTo: '' }

  const terms = q.split(/\s+/)
  const direct = apps.filter((a) => terms.every((t) => haystack(a).includes(t)))
  if (direct.length) return { results: direct, correctedTo: '' }

  const vocab = new Set()
  apps.forEach((a) =>
    haystack(a)
      .split(/[^a-z0-9]+/)
      .forEach((w) => {
        if (w.length > 2) vocab.add(w)
      }),
  )

  const corrected = terms
    .map((t) => {
      let best = t
      let bestD = Math.max(1, Math.floor(t.length / 3))
      vocab.forEach((w) => {
        const d = levenshtein(t, w)
        if (d <= bestD) {
          bestD = d
          best = w
        }
      })
      return best
    })
    .join(' ')

  if (corrected !== q) {
    const fuzzy = apps.filter((a) => corrected.split(/\s+/).every((t) => haystack(a).includes(t)))
    if (fuzzy.length) return { results: fuzzy, correctedTo: corrected }
  }
  return { results: [], correctedTo: '' }
}

// --- ids ------------------------------------------------------------------
// A counter, not Math.random(): the same sequence on the server and in the browser.
let counter = 0

export function uid(prefix = 'id') {
  counter += 1
  return `${prefix}-${counter}`
}

/** A plausible-looking transaction reference, derived from the counter. */
export function purchaseRef() {
  counter += 1
  return `AFN-TX-${(0x5f3a21 + counter * 104729).toString(36).toUpperCase().slice(-6)}`
}
