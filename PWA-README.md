# PWA Implementation Guide (for an agent)

Hand this file to an agent to add PWA ("install the app") support to a Nuxt 3/4
project. It is based on the working setup in the Family Doctor codebase, with
the known gaps in that setup fixed (install counting, iOS tracking, DB
connection, icon wiring).

**Stack assumed:** Nuxt 4 (works on Nuxt 3), Vue 3, `ssr: true`, Tailwind,
Font Awesome icons, MongoDB/Mongoose for install analytics. If the target
project has no Mongo, keep everything except step 7 and swap the storage layer.

> **Before starting:** read the target project's `nuxt.config.ts`, `app.vue`,
> and how its server routes connect to the database. Replace every value marked
> `CHANGE ME` with the target project's name, colors, and routes.

---

## 0. How it works in Family Doctor (reference)

| Piece | File | What it does |
|---|---|---|
| Module | `nuxt.config.ts` → `modules: [..., '@vite-pwa/nuxt']` | Generates the manifest + Workbox service worker at build time |
| Config | `nuxt.config.ts` → `pwa: {...}` | Manifest, caching rules, install prompt, hourly update check |
| Head tags | `app.vue` → `<NuxtPwaAssets />` | Injects `<link rel="manifest">` + `theme-color` meta |
| Install button | `components/PwaInstallBanner.vue` | Android/desktop "Install App" button; iOS "Add to Home Screen" hint |
| Update toast | `components/PwaUpdateToast.vue` | "New update available → Update" when a new SW is ready |
| Install tracking | `app.vue` `appinstalled` listener → `POST /api/pwa/track-install` | Inserts one `PwaInstall` document per install |
| Model | `models/PwaInstall.model.ts` | `{ installedAt, createdAt, updatedAt }` only |
| Icons | `public/icons/*.png` | 64, 192, 512, 512 maskable, 180 apple-touch |

### Is the number of installs saved? — Yes, but only partially

- **Saved:** every time the browser fires `appinstalled`, one row goes into the
  `pwainstalls` Mongo collection, so `db.pwainstalls.countDocuments()` gives the total.
- **Gaps:**
  1. **Nothing reads it.** There's no API endpoint or admin screen that shows the count.
  2. **iOS installs are never counted.** Safari doesn't fire `appinstalled`;
     "Add to Home Screen" can't be detected at install time.
  3. **No context.** No platform, user, or date bucket, and no dedupe (if
     someone uninstalls and reinstalls, they're counted twice).
  4. **DB connection isn't guaranteed.** The route doesn't call
     `ensureConnection()`. It relies on the Nuxt app plugin `plugins/mongodb.ts`,
     which only runs during an SSR page render, not for API requests.
  5. **Errors aren't caught.** The client `$fetch` in `app.vue` has no `catch`.

### Other "downloads" in Family Doctor (not PWA)

- `GET /api/family-doctor/remedy/[id]/download` and
  `GET /api/family-doctor/emergency-card/[id]/download` build PDFs with
  `pdfkit` and stream them back with `Content-Disposition: attachment`.
  **Download counts aren't saved anywhere.**
- `components/FamilyDoctor/CommunityResources/List.vue` shows "N downloads",
  but those numbers are **hardcoded mock data**.

The steps below set up PWA with the gaps fixed.

---

## 1. Install the module

```bash
npm install -D @vite-pwa/nuxt
```

`nuxt.config.ts`:
```ts
modules: [
  // ...existing modules
  '@vite-pwa/nuxt'
],
```

If Vite complains about `workbox-window` during dev, add it to
`vite.optimizeDeps.include` (Family Doctor does this).

---

## 2. `nuxt.config.ts` → `pwa` block

```ts
pwa: {
  registerType: 'autoUpdate',

  manifest: {
    name: 'Family Doctor',                          // CHANGE ME
    short_name: 'FamilyDoc',                        // CHANGE ME (≤ 12 chars)
    description: 'Your health intelligence platform', // CHANGE ME
    theme_color: '#0284c7',                         // CHANGE ME
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait',
    scope: '/',
    start_url: '/network?source=pwa',               // CHANGE ME (app "home" route)
    icons: [
      { src: '/icons/pwa-64x64.png',   sizes: '64x64',   type: 'image/png' },
      { src: '/icons/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  },

  workbox: {
    navigateFallback: null,   // SSR app: no SPA shell to serve offline
    globPatterns: ['**/*.{js,css,html,png,svg,ico,webp,woff2}'],
    runtimeCaching: [
      { urlPattern: /^\/api\//, handler: 'NetworkOnly' },  // never cache API
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
        handler: 'CacheFirst',
        options: { cacheName: 'images-cache', expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 } }
      },
      {
        urlPattern: /\.(?:woff|woff2|ttf|eot)$/,
        handler: 'CacheFirst',
        options: { cacheName: 'fonts-cache', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } }
      }
    ]
  },

  client: {
    installPrompt: true,          // exposes $pwa.showInstallPrompt / $pwa.install()
    periodicSyncForUpdates: 3600  // check for a new SW every hour
  },

  registerWebManifestInRouteRules: true,

  devOptions: {
    enabled: false,  // set true temporarily to test the SW in `nuxt dev`
    type: 'module'
  }
},
```

How this differs from Family Doctor (on purpose):
- The dedicated `maskable-icon-512x512.png` is used for `purpose: 'maskable'`
  (Family Doctor reuses `pwa-512x512.png` as `'any maskable'`, so Android can
  crop it badly).
- `start_url` gets `?source=pwa` so launches from the installed app can be
  detected (used for iOS tracking in step 7).

### Apple head tags

Add these to `app.head.link` / `app.head.meta`. Without a `pwaAssets` config,
`<NuxtPwaAssets />` only adds the manifest link and theme color, so iOS needs
these added directly:
```ts
link: [
  { rel: 'apple-touch-icon', href: '/icons/apple-touch-icon-180x180.png' }
],
meta: [
  { name: 'apple-mobile-web-app-capable', content: 'yes' },
  { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
  { name: 'apple-mobile-web-app-title', content: 'FamilyDoc' } // CHANGE ME
]
```

---

## 3. Icons → `public/icons/`

| File | Size | Notes |
|---|---|---|
| `pwa-64x64.png` | 64×64 | |
| `pwa-192x192.png` | 192×192 | required for install |
| `pwa-512x512.png` | 512×512 | required for install + splash |
| `maskable-icon-512x512.png` | 512×512 | logo inside the center 80% safe zone (check on maskable.app) |
| `apple-touch-icon-180x180.png` | 180×180 | no transparency |

If the project only has one logo, generate these with
`npx @vite-pwa/assets-generator --preset minimal-2023 public/logo.svg`
and move the output into `public/icons/` with the names above.

---

## 4. `app.vue`

```vue
<template>
  <NuxtPwaAssets />

  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>

  <PwaInstallBanner />
  <PwaUpdateToast />
</template>

<script setup lang="ts">
const { trackInstall } = usePwaTracking()

onMounted(() => {
  // Chromium (Android, desktop Chrome/Edge): fires on install from our button OR the browser menu
  window.addEventListener('appinstalled', () => trackInstall('appinstalled'))

  // iOS (and everything else): first launch in standalone mode = installed
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as any).standalone === true
  if (standalone) trackInstall('standalone-launch')
})
</script>
```

If the project's `app.vue` already has content, merge these into it rather
than replacing it.

---

## 5. `components/PwaInstallBanner.vue`

Same as Family Doctor, plus: the iOS hint stays dismissed (saved in
localStorage) and doesn't show while already in standalone mode.

```vue
<template>
  <!-- Android / Desktop: programmatic install -->
  <Transition name="pop">
    <button
      v-if="$pwa && $pwa.showInstallPrompt && !$pwa.isPWAInstalled"
      @click="handleInstall"
      class="fixed bottom-6 right-5 z-50 flex items-center gap-2 px-4 py-3 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-2xl shadow-lg shadow-sky-600/40 transition-all duration-200"
    >
      <i class="fa fa-download text-sm" />
      <span class="text-sm font-semibold">Install App</span>
    </button>
  </Transition>

  <!-- iOS Safari: manual instructions (no install API exists on iOS) -->
  <Transition name="pop">
    <div
      v-if="showIosHint"
      class="fixed bottom-6 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl p-4 shadow-xl"
    >
      <button @click="dismiss" class="absolute top-3 right-3 text-gray-400">
        <i class="fa fa-x text-xs" />
      </button>
      <p class="text-sm font-bold mb-1">Install Family Doctor</p> <!-- CHANGE ME -->
      <p class="text-xs text-gray-400">
        Tap <i class="fa-solid fa-arrow-up-from-bracket mx-1" /> then
        <strong>"Add to Home Screen"</strong>
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const { $pwa } = useNuxtApp()
const dismissed = ref(true) // stays hidden until mounted, so SSR and client match

onMounted(() => {
  try { dismissed.value = localStorage.getItem('pwa-ios-hint-dismissed') === '1' }
  catch { dismissed.value = false }
})

const showIosHint = computed(() => {
  if (import.meta.server || dismissed.value) return false
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)
  const standalone = (navigator as any).standalone === true
  return isIos && !standalone
})

function dismiss() {
  dismissed.value = true
  try { localStorage.setItem('pwa-ios-hint-dismissed', '1') } catch {}
}

async function handleInstall() {
  const choice = await ($pwa as any)?.install()
  // install() doesn't move the current tab to start_url, so navigate there ourselves
  if (choice?.outcome === 'accepted') await navigateTo('/network') // CHANGE ME
}
</script>

<style scoped>
.pop-enter-active { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease; }
.pop-leave-active { transition: transform 0.2s ease, opacity 0.2s ease; }
.pop-enter-from, .pop-leave-to { transform: scale(0.5) translateY(20px); opacity: 0; }
</style>
```

---

## 6. `components/PwaUpdateToast.vue`

Copy as-is from Family Doctor:

```vue
<template>
  <Transition name="slide-down">
    <div
      v-if="$pwa && $pwa.needRefresh"
      class="fixed top-4 left-4 right-4 z-50 bg-gray-900 text-white rounded-2xl p-4 flex items-center justify-between shadow-xl"
    >
      <div class="flex items-center gap-2">
        <i class="fa fa-rotate text-sky-400" />
        <p class="text-sm font-medium">New update available</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="$pwa.updateServiceWorker()" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-bold transition">
          Update
        </button>
        <button @click="$pwa.cancelPrompt()" class="p-1.5 bg-gray-700 rounded-lg text-sm">
          <i class="fa fa-x text-xs" />
        </button>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.slide-down-enter-active, .slide-down-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-down-enter-from, .slide-down-leave-to { transform: translateY(-100%); opacity: 0; }
</style>
```

`$pwa` is injected by `@vite-pwa/nuxt`, so no plugin is needed.

---

## 7. Install tracking (counting installs)

### 7a. Client composable: `composables/usePwaTracking.ts`

Assigns each device a random ID once, so the server can skip duplicates (an
`appinstalled` event and a later standalone launch on the same device count
as one install).

```ts
export function usePwaTracking() {
  function deviceId(): string {
    try {
      let id = localStorage.getItem('pwa-device-id')
      if (!id) {
        id = crypto.randomUUID()
        localStorage.setItem('pwa-device-id', id)
      }
      return id
    } catch {
      return 'unknown'
    }
  }

  function platform(): string {
    const ua = navigator.userAgent
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
    if (/android/i.test(ua)) return 'android'
    if (/windows|macintosh|linux/i.test(ua)) return 'desktop'
    return 'other'
  }

  async function trackInstall(source: 'appinstalled' | 'standalone-launch') {
    try {
      // only one call per device for standalone launches
      if (source === 'standalone-launch' && localStorage.getItem('pwa-install-tracked') === '1') return
      await $fetch('/api/pwa/track-install', {
        method: 'POST',
        body: { deviceId: deviceId(), platform: platform(), source }
      })
      localStorage.setItem('pwa-install-tracked', '1')
    } catch (e) {
      console.warn('PWA install tracking failed', e)
    }
  }

  return { trackInstall }
}
```

> iOS caveat: Safari's home-screen app has its **own localStorage**, separate
> from the Safari tab. On iOS, the standalone launch generates a new device ID,
> which is fine because Safari never fired `appinstalled`, so there's nothing
> to double-count.

### 7b. Model: `models/PwaInstall.model.ts`

```ts
import mongoose from 'mongoose'

const PwaInstallSchema = new mongoose.Schema({
  deviceId:    { type: String, required: true },
  platform:    { type: String, enum: ['ios', 'android', 'desktop', 'other'], default: 'other' },
  source:      { type: String, enum: ['appinstalled', 'standalone-launch'], required: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, default: null }, // set if a session exists
  userAgent:   { type: String },
  installedAt: { type: Date, default: Date.now }
}, { timestamps: true })

PwaInstallSchema.index({ deviceId: 1 }, { unique: true })
PwaInstallSchema.index({ installedAt: -1 })
PwaInstallSchema.index({ platform: 1 })

export const PwaInstall = mongoose.models.PwaInstall ||
  mongoose.model('PwaInstall', PwaInstallSchema)
```

> **If migrating Family Doctor:** existing rows have no `deviceId`. Before
> creating the unique index, back-fill them, e.g.
> `db.pwainstalls.updateMany({ deviceId: { $exists: false } }, [{ $set: { deviceId: { $toString: '$_id' }, source: 'appinstalled', platform: 'other' } }])`.

### 7c. Write endpoint: `server/api/pwa/track-install.post.ts`

```ts
import { PwaInstall } from '~/models/PwaInstall.model'
import { ensureConnection } from '~/utils/mongodb'

export default defineEventHandler(async (event) => {
  await ensureConnection()

  const body = await readBody<{ deviceId?: string; platform?: string; source?: string }>(event)
  if (!body?.deviceId || typeof body.deviceId !== 'string' || body.deviceId.length > 64) {
    throw createError({ statusCode: 400, message: 'deviceId required' })
  }

  // Optional: attach the logged-in user, using this project's session cookie(s)
  let userId: string | null = null
  try {
    const raw = getCookie(event, 'family_doctor_session') // CHANGE ME
    if (raw) userId = JSON.parse(raw).userId ?? null
  } catch {}

  // Upsert = one row per device, no matter how many times it's called
  const res = await PwaInstall.updateOne(
    { deviceId: body.deviceId },
    {
      $setOnInsert: {
        platform: ['ios', 'android', 'desktop'].includes(body.platform!) ? body.platform : 'other',
        source: body.source === 'standalone-launch' ? 'standalone-launch' : 'appinstalled',
        userAgent: getHeader(event, 'user-agent')?.slice(0, 300),
        installedAt: new Date(),
        userId
      }
    },
    { upsert: true }
  )

  return { success: true, counted: res.upsertedCount === 1 }
})
```

### 7d. Read endpoint: `server/api/pwa/stats.get.ts`

**Protect this with the project's admin auth.** Look for how existing
admin routes check sessions and copy that check.

```ts
import { PwaInstall } from '~/models/PwaInstall.model'
import { ensureConnection } from '~/utils/mongodb'

export default defineEventHandler(async (event) => {
  // TODO: replace with the project's real admin check
  // requireAdmin(event)

  await ensureConnection()

  const since30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [total, last30Days, byPlatform, daily] = await Promise.all([
    PwaInstall.countDocuments(),
    PwaInstall.countDocuments({ installedAt: { $gte: since30d } }),
    PwaInstall.aggregate([{ $group: { _id: '$platform', count: { $sum: 1 } } }]),
    PwaInstall.aggregate([
      { $match: { installedAt: { $gte: since30d } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$installedAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ])
  ])

  return {
    total,
    last30Days,
    byPlatform: Object.fromEntries(byPlatform.map((p: any) => [p._id, p.count])),
    daily: daily.map((d: any) => ({ date: d._id, count: d.count }))
  }
})
```

Optionally, show `total` and `byPlatform` as a stat card on the existing
admin dashboard.

### 7e. (Optional) Google Analytics too

Family Doctor already loads `nuxt-gtag`. Inside `trackInstall`, also call
`useGtag().gtag('event', 'pwa_install', { platform: platform(), source })`
so installs appear in GA alongside the database count.

---

## 8. Counting file downloads (optional, if asked)

The PDF download routes don't save counts. To add counting, use the same
approach: create a `DownloadEvent` model `{ kind: 'remedy-pdf' | 'emergency-card-pdf', resourceId, userId, createdAt }`
and add one line just before `return pdfBuffer` in each download route:

```ts
DownloadEvent.create({ kind: 'remedy-pdf', resourceId: remedyId, userId }).catch(() => {})
```

(Don't `await` it, so a logging failure never breaks the download.) To
replace the mock "N downloads" in `CommunityResources/List.vue`, return real
counts from `DownloadEvent.countDocuments({ resourceId })`.

---

## 9. Verify

1. `npm run build && npm run preview`. The SW is off in `nuxt dev`.
2. Chrome DevTools → **Application → Manifest**: no errors, icons load, "Installable".
3. **Application → Service Workers**: `sw.js` activated.
4. Click **Install App**, then check that a `pwainstalls` row exists with `source: 'appinstalled'`.
5. Open the installed app again, then check that no second row appears for that device.
6. iOS: Safari → Share → Add to Home Screen → open it. A row should appear with `platform: 'ios'`, `source: 'standalone-launch'`.
7. `GET /api/pwa/stats` (as admin) returns `total`, `byPlatform`, `daily`.
8. Rebuild with a small change, reload, and check that the "New update available" toast appears.
9. Network tab: `/api/*` requests always go to the network (never "from ServiceWorker").

## Checklist

- [ ] `@vite-pwa/nuxt` installed + in `modules`
- [ ] `pwa` block added, `CHANGE ME` values replaced
- [ ] Apple head tags added
- [ ] 5 icons in `public/icons/`
- [ ] `<NuxtPwaAssets />`, `<PwaInstallBanner />`, `<PwaUpdateToast />` in `app.vue`
- [ ] `appinstalled` + standalone-launch tracking in `app.vue`
- [ ] `composables/usePwaTracking.ts`
- [ ] `PwaInstall` model with `deviceId` unique index
- [ ] `POST /api/pwa/track-install` (calls `ensureConnection`, upserts)
- [ ] `GET /api/pwa/stats` (admin-protected)
- [ ] Verified with build + preview
