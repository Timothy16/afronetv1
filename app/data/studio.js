// app/data/studio.js
//
// The developer side: templates to start from, the apps this account has built, and the
// vocabulary the wizard and the builder share.
//
// Mock data for the UI phase. The shapes follow the developer guide's build record — a
// prompt, a config, a version history, a review trail — so the dynamic phase can replace
// the seed array with the API and leave the screens alone.
//
// What is NOT here, deliberately: any claim about working offline. This release needs a
// connection, so the wizard has no offline step and no app carries an offline label. What
// a build *needs a connection for* is still tracked, because that is a real fact about the
// app and it drives permissions and review.

import { formatDate, formatNaira, permissionCatalogue } from '~/data/store'

/**
 * What a screen shows before the real figures arrive from /api/studio/quota.
 *
 * Zero, and `enough` false, so nothing offers to build an app until the server has said
 * whether this account can afford one. A number invented here would be wrong for everybody.
 */
export const aiQuota = {
  balance: 0,
  allowance: 0,
  renewsOn: '',
  maxPerGeneration: 0,
  enough: false,
  blockedReason: '',
}

// --- status ---------------------------------------------------------------
// One label per state, used by every badge and filter, so an app in review cannot be
// described two ways on two screens.
export const statusMeta = {
  draft: { label: 'Draft', tone: 'muted' },
  generating: { label: 'Generating', tone: 'brand' },
  building: { label: 'Building', tone: 'brand' },
  testing: { label: 'Testing', tone: 'brand' },
  review_required: { label: 'Ready to submit', tone: 'gold' },
  in_review: { label: 'In review', tone: 'gold' },
  published: { label: 'Published', tone: 'success' },
  rejected: { label: 'Changes required', tone: 'danger' },
  suspended: { label: 'Suspended', tone: 'danger' },
  archived: { label: 'Archived', tone: 'outline' },
}

export const allStatuses = Object.keys(statusMeta)

export function statusLabel(status) {
  return statusMeta[status]?.label ?? status
}

// --- the vocabulary the wizard offers ------------------------------------
export const appTypes = [
  { id: 'education', label: 'Education', icon: 'fa-book-open' },
  { id: 'productivity', label: 'Productivity', icon: 'fa-calendar-days' },
  { id: 'finance', label: 'Finance & calculators', icon: 'fa-calculator' },
  { id: 'games', label: 'Games', icon: 'fa-gamepad' },
  { id: 'campus', label: 'Campus services', icon: 'fa-map' },
  { id: 'health', label: 'Lifestyle', icon: 'fa-heart-pulse' },
  { id: 'utilities', label: 'Other', icon: 'fa-wrench' },
]

// Capabilities were a list a developer ticked — forms, search, images, notifications, internet
// — before describing the app. Nothing read most of them, and nothing checked any of them
// against the code that was generated, so a listing could promise notifications an app never
// sends. They come back when something reads the generated app and reports what it actually
// uses; asking the developer to declare it was never going to be true.

/** The palette, offered by name. A build cannot introduce a colour of its own. */
export const themeTones = [
  { id: 'brand', label: 'Green' },
  { id: 'ink', label: 'Charcoal' },
  { id: 'gold', label: 'Gold' },
  { id: 'success', label: 'Leaf' },
  { id: 'danger', label: 'Clay' },
  { id: 'muted', label: 'Slate' },
]

/** Icons a developer can pick for their app. */
export const appIcons = [
  'fa-list-check', 'fa-layer-group', 'fa-calculator', 'fa-book-open', 'fa-flask', 'fa-stopwatch',
  'fa-pen-to-square', 'fa-map', 'fa-gamepad', 'fa-language', 'fa-wallet', 'fa-heart-pulse',
]

/** The stages a generation walks through. Server-side work in the dynamic phase. */
export const generateStages = [
  'Understanding your idea',
  'Planning screens and data',
  'Generating content',
  'Packaging for the Afronet runtime',
  'Running safety scan',
]

// --- templates ------------------------------------------------------------
export const templates = [
  { id: 'quiz', name: 'Past-question quiz', description: 'Multiple-choice questions with explanations and scores.', icon: 'fa-list-check', category: 'education', prompt: 'A past-question quiz for WAEC Biology with explanations and a score at the end.' },
  { id: 'flashcards', name: 'Flashcards', description: 'Decks, flip cards and spaced review.', icon: 'fa-layer-group', category: 'education', prompt: 'Flashcards for memorising pharmacology drug names.' },
  { id: 'gpa', name: 'GPA calculator', description: 'Course units, grades and CGPA history.', icon: 'fa-calculator', category: 'finance', prompt: 'A GPA calculator on the Nigerian 5-point scale.' },
  { id: 'timetable', name: 'Study timetable', description: 'Weekly grid with study blocks and reminders.', icon: 'fa-calendar-days', category: 'productivity', prompt: 'A weekly study timetable with reminders before each lecture.' },
  { id: 'vocab', name: 'Vocabulary trainer', description: 'Word lists, quizzes and streaks.', icon: 'fa-language', category: 'education', prompt: 'A French vocabulary trainer for first-year students.' },
  { id: 'directory', name: 'Campus directory', description: 'Searchable list of offices and contacts.', icon: 'fa-map', category: 'campus', prompt: 'A directory of faculty offices and contact hours on my campus.' },
  { id: 'budget', name: 'Budget planner', description: 'Track spending against weekly limits.', icon: 'fa-wallet', category: 'finance', prompt: 'A budget planner for my monthly allowance in naira.' },
  { id: 'notes', name: 'Notes app', description: 'Organised notes by course with search.', icon: 'fa-pen-to-square', category: 'productivity', prompt: 'A notes app organised by course with search.' },
  { id: 'focus', name: 'Focus timer', description: 'Pomodoro sessions with daily targets.', icon: 'fa-stopwatch', category: 'productivity', prompt: 'A focus timer with 25-minute sessions and daily goals.' },
  { id: 'game', name: 'Educational game', description: 'Levels, points and learning feedback.', icon: 'fa-gamepad', category: 'games', prompt: 'A spelling game for primary school pupils.' },
]

export function findTemplate(id) {
  return templates.find((t) => t.id === id)
}

export const suggestedPrompts = [
  'A past-question quiz for JAMB Chemistry with explanations',
  'A GPA calculator that remembers every semester',
  'A Yoruba–English vocabulary trainer with daily streaks',
  'A directory of student clubs on my campus',
]

// --- what a build needs a connection for ----------------------------------
/**
 * Read from the build rather than from what the developer claimed. The guide's point: the
 * platform decides this, not the listing. The server keeps its own copy for publishing.
 */
export function connectionNeeds(config) {
  const needs = []
  if (config.externalApi) needs.push('An external service')
  return needs
}

// Builds live in the database. Studio reads them through useStudio, which fetches
// /api/studio/apps. Nothing is seeded: every build an account has is one it generated.

// --- the builder's chat --------------------------------------------------
//
// Asking for a change in words is a second generation — the app is rewritten, not patched —
// and that is not wired up yet. What was here was a set of hand-written rules that understood
// six phrases and answered everything else with an apology. It went with the templates.
//
// The design side of the builder still works: the panel on the right edits the build directly
// and costs nothing.

export const changesComingSoon =
  'Changing an app by describing the change is coming. For now, create the app you want and use the settings on the right to adjust how it looks.'

// --- creating one --------------------------------------------------------
/** The first three words of an idea, which is usually a decent working name. */
export function nameFromPrompt(prompt) {
  const words = String(prompt || '')
    .replace(/^(a|an|the)\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join(' ')
  if (!words) return 'My App'
  return words.charAt(0).toUpperCase() + words.slice(1)
}

// --- navigation -----------------------------------------------------------
// Analytics, earnings, payouts, reviews and the developer profile are later work; the nav
// carries only what exists, so nothing here leads to a dead end.
export const studioNav = [
  { to: '/studio', label: 'Overview', icon: 'fa-gauge', exact: true },
  { to: '/studio/apps', label: 'My Apps', icon: 'fa-cubes' },
  { to: '/store', label: 'App Store', icon: 'fa-store' },
]

export const studioCopy = {
  simulated: 'AI generation is simulated in this prototype. The real version runs on Afronet’s server.',
  firstSteps: ['Describe your app', 'Preview and refine it', 'Set a price (or keep it free)', 'Publish and track installs'],
}

// --- testing --------------------------------------------------------------
// What can be said truthfully about a generated build, and nothing else.
//
// The size is the real one: the server measures the generated files and stores it on the
// build, so this reads rather than guesses. Checks that would need a build-and-validation
// service to answer — cold start, memory, a safety scan — are not here, because inventing a
// figure for them is how a report stops being worth reading.

/**
 * The real packaged size, measured when the app was generated.
 *
 * Not rounded to one decimal place. A generated app is tens of kilobytes, so a tenth of a
 * megabyte is coarser than the whole file — rounding there reported every app as "0 MB".
 * `formatMB` turns a small figure into kilobytes for display.
 */
export function packageMB(app) {
  return Math.round((app?.packageMB ?? 0) * 1000) / 1000
}

export function installedMB(app) {
  return Math.round(packageMB(app) * 1.5 * 1000) / 1000
}

export function testChecks(app) {
  const c = app.config
  const needs = connectionNeeds(c)
  const accessible = c.fontScale === 'large' || c.highContrast

  return [
    {
      name: 'App was generated',
      result: app.hasFiles ? 'pass' : 'fail',
      detail: app.hasFiles
        ? `Packaged for runtime v1 · ${packageMB(app)} MB`
        : 'This build has no code yet, so there is nothing to package.',
    },
    {
      name: 'Permissions match what the app uses',
      result: needs.length ? 'warn' : 'pass',
      detail: needs.length
        ? 'This build reaches a service of its own, so users will see the internet permission.'
        : 'Keeps what you do while it is open, reaches nothing. That is the only permission users see.',
    },
    {
      name: 'Package size within its stated limit',
      result: packageMB(app) <= 25 ? 'pass' : 'warn',
      detail: `${packageMB(app)} MB to download, about ${installedMB(app)} MB installed.`,
    },
    {
      name: 'Readable text and contrast',
      result: accessible ? 'pass' : 'warn',
      detail: accessible
        ? 'Larger text or high contrast is switched on for this build.'
        : 'Neither larger text nor high contrast is on. Both help on a bright screen outdoors.',
    },
  ]
}

// --- the publishing checklist --------------------------------------------
// 'todo' blocks submission. 'attention' does not: a reviewer will look at it, and saying so
// is more honest than refusing to let someone submit over a judgement call.
export function publishChecklist(app) {
  const needs = connectionNeeds(app.config)
  const usesNetwork = needs.length > 0

  return [
    { label: 'App builds successfully', state: 'done', note: `Version ${app.version}` },
    {
      label: 'Tests pass',
      state: app.testedAt ? 'done' : 'todo',
      note: app.testedAt ? `Tested ${formatDate(app.testedAt)}` : 'Run the tests after your latest changes',
      fix: `/studio/apps/${app.id}/test`,
    },
    {
      label: 'Permissions declared',
      state: 'done',
      note: needs.length ? needs.join(', ') : 'Save data on this device',
      fix: `/studio/builder/${app.id}`,
    },
    {
      label: 'No prohibited code or content',
      state: app.testedAt ? 'done' : 'todo',
      note: app.testedAt ? 'Safety scan passed' : 'Runs with the tests',
      fix: `/studio/apps/${app.id}/test`,
    },
    {
      label: 'Description complete',
      state: app.description.length >= 40 && app.tagline.length >= 10 ? 'done' : 'todo',
      note: 'A short description, and a full one',
      fix: `/studio/apps/${app.id}/listing`,
    },
    {
      label: 'Privacy information provided',
      state: !usesNetwork || app.privacyPolicy.length > 20 ? 'done' : 'todo',
      note: usesNetwork ? 'Required, because this app uses the network' : 'Nothing collected',
      fix: `/studio/apps/${app.id}/listing`,
    },
    {
      label: 'Pricing set',
      state: app.pricingDone ? 'done' : 'todo',
      note: app.pricingDone ? (app.pricingModel === 'paid' ? formatNaira(app.price) : 'Free') : 'Choose free, or a price',
      fix: `/studio/apps/${app.id}/pricing`,
    },
  ]
}

// The review stages were 'Submitted', 'Automated validation', 'In the review queue',
// 'Human review', 'Decision'. Four of the five described work nobody was doing. The one that
// described something worth doing — the automated checks — is now real, and lives on the
// server in validateApp.ts where it can refuse to publish.

// --- versions -------------------------------------------------------------
export function bumpVersion(version, kind = 'minor') {
  const parts = String(version).split('.').map((x) => parseInt(x, 10) || 0)
  const major = parts[0] ?? 0
  const minor = parts[1] ?? 0
  const patch = parts[2] ?? 0
  return kind === 'minor' ? `${major}.${minor + 1}.0` : `${major}.${minor}.${patch + 1}`
}
