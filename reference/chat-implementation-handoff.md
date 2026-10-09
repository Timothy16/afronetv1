# Afronet: On-device AI Chat, Implementation Handoff

> **For Claude Code in the main project workspace.** This document captures what was proven in a
> separate prototype (`sync-app`, Nuxt 4 PWA) over several weeks of real-device testing, and how to
> bring that working chat into this project. Read it fully, then **do the Step 0 investigation and
> report back before writing code.** Adapt everything to this project's existing conventions (API
> style, auth, data models, components, styling) — the prototype's structure is a reference, not a
> template to paste over this codebase.
>
> **Reference code** lives in `reference/sync-app/` (same paths as in the prototype, e.g.
> `reference/sync-app/app/lib/llm/transformers.worker.ts`). It is **not part of this app's build**:
> port and adapt it into this project's own folders. If `vue-tsc`/`nuxi typecheck` picks up files
> under `reference/`, exclude that folder in `tsconfig.json`. Delete `reference/` once the port is done.

---

## 1. What we're building

A chat where **the AI model runs entirely on the user's device** (in the browser, via WebAssembly or
WebGPU). No AI server. The model downloads once, is cached on the device, and works offline.

Scope for this phase:

1. **Chat UI** wired into this project's existing UI: a **conversation sidebar** (list, select, new
   chat) and the **chat area** (messages, input, streaming reply, stop), like Claude/ChatGPT web.
2. **Conversation history synced to the user's account** through new API endpoints + data models,
   so users can continue on any device — but **saved on the device first**, so chat works offline.
3. **Model dropdown** with two options, labelled with where each is recommended.
4. **PWA** (installable, app shell + AI runtime available offline) — **in scope**, built as the
   last feature phase (§10), after the chat works online.

Language: **English only** for now.

---

## 2. Proven results (real iPhone 14 Pro, Safari 26/27, installed PWA)

| Setup | Result |
|---|---|
| **SmolLM2-360M-Instruct, `int8`, CPU (WASM), 2 threads** | **30/30 questions, 0 crashes, ~24.5 tok/s, first word ~2.3 s** ✅ chosen for phones |
| Same, 1 thread | 30/30, ~16.8 tok/s, first word ~3.5 s |
| Same, 4 threads | 30/30, ~17.3 tok/s (slower than 2: phones have 2 fast + several slow cores) |
| Model download (365 MB, Wi-Fi) | ~85 s; re-open from cache: model ready in ~1–2 s |

Answers stream smoothly and are clearly more accurate than the previous model. Chats with ~350 tokens
of history were handled without issue.

---

## 3. What failed — do NOT repeat

| Tried | What happened | Why |
|---|---|---|
| Gemma 3 1B (any runtime) | iPhone tab crashed / 4 GB Android hung while starting | Too much memory for a mobile browser tab |
| Gemma 3 270M on **WebGPU** on iPhone | Page silently restarts 2–10 s after every reply | WebKit + ONNX Runtime WebGPU bug (onnxruntime#26827 / #27584) — **never use the GPU path on WebKit** |
| Gemma 3 270M on CPU | 0.4–1.4 tok/s; crashed mid-reply once chats grew | 262k-token vocabulary → ~1 MB of logits per prompt token; 4-bit `MatMulNBits` has no fast WASM kernel |
| Gemma int8 conversion | Garbage output | Gemma activation outliers break per-tensor 8-bit quantization |
| wllama (llama.cpp WASM) | Crashed on iPhone while starting (GPU and CPU) | — |
| 4 threads on phones | Slower than 2 | big.LITTLE cores |
| Low Power Mode (iPhone) | ~3× slower | Expected; not a bug |

**Gemma is removed entirely.** Use the SmolLM2 family (Apache 2.0) exactly as published — **do not
modify or convert model files.**

---

## 4. Architecture overview

```
UI (sidebar + chat + model dropdown)
   │
   ├── useConversations  ── local store (IndexedDB) ── sync queue ──► API (/api/conversations…) ──► DB
   │        (local-first: every write hits IndexedDB immediately; synced when online)
   │
   └── useLLM / useChat ──► LLMEngine (interface) ──► TransformersEngine (main thread proxy)
                                                          │ postMessage
                                                          ▼
                                                 transformers.worker.ts (Web Worker)
                                                 transformers.js v4 + ONNX Runtime Web
                                                 model files in Cache Storage
```

Design rules (keep these):
- The model sits behind an **`LLMEngine` interface** created by one factory. Swapping model/runtime
  must not touch UI code.
- **Voice comes later** behind the same pattern (`STTEngine` / `TTSEngine`). Don't build it; don't block it.
- The AI only ever runs on the device. **Only conversation text goes to the server.**

---

## Step 0 — Investigate this workspace first, then report back

Before writing code, examine and summarise for the developer:

1. **Rendering mode**: is `ssr` on? All AI code must run **client-only** (worker, `navigator.gpu`,
   Cache Storage, IndexedDB). Use `.client` plugins/components or `<ClientOnly>` / `onMounted` guards.
2. **Auth**: how sessions work (cookies/JWT, middleware, how API routes get the current user).
   Conversation endpoints must reuse it.
3. **API conventions**: `server/api` structure, validation library, error format, response shape.
4. **Data layer**: ORM / database / existing models and migrations, ID conventions (we need
   **client-generated UUIDs** — check compatibility).
5. **UI**: the existing sidebar + chat components, state management (Pinia? composables?), styling
   system. Plan how the chat logic plugs into them rather than replacing them.
6. **Cross-origin isolation readiness** (needed for multi-threaded WASM, see §7.6). Search for
   anything loaded from another origin: fonts (Google Fonts), images/avatars, analytics, OAuth or
   payment popups/iframes, CDN scripts. The developer believes there are none (auth is first-party
   only). **Confirm and explain**: with `Cross-Origin-Embedder-Policy: require-corp`, any
   cross-origin resource without CORS/CORP headers will be blocked, and COOP `same-origin` breaks
   cross-origin popups (e.g. OAuth popups) talking back to the page.
7. **Existing `nuxt.config`**: modules, Vite config, any PWA module already present, `routeRules`.
8. Package manager, Node version, existing `@huggingface/transformers` or similar deps.

Report findings + a short build plan mapped to this codebase, then proceed phase by phase (§12).

---

## 5. Models

Two options in the dropdown. Specs below are **pinned to exact commits** so upstream changes can't
alter what users download. Files are fetched from
`https://huggingface.co/{id}/resolve/{revision}/{file}` (CORS enabled).

```ts
type VariantKey = 'webgpu-f16' | 'webgpu' | 'wasm'
interface ModelVariant { dtype: string, files: string[], downloadBytes: number, externalData?: boolean }
interface ModelSpec {
  key: string; id: string; label: string; revision: string
  recommendedFor: 'phones' | 'laptops'
  variants: Partial<Record<VariantKey, ModelVariant>>
  sampling: { temperature: number, topK: number, topP: number, repetitionPenalty: number }
}

const TOKENIZER_FILES = ['tokenizer.json', 'tokenizer_config.json', 'config.json', 'generation_config.json']
const TOKENIZER_BYTES = 2_200_000
// SmolLM2's recommended settings: low temperature keeps small models on track.
const SMOLLM2_SAMPLING = { temperature: 0.2, topK: 50, topP: 0.9, repetitionPenalty: 1.1 }

export const SMOLLM2_360M: ModelSpec = {
  key: 'smollm2-360m',
  id: 'HuggingFaceTB/SmolLM2-360M-Instruct',
  label: 'SmolLM2 360M',
  recommendedFor: 'phones',
  revision: 'a10cc1512eabd3dde888204e902eca88bddb4951',
  variants: {
    'webgpu-f16': { dtype: 'q4f16', files: [...TOKENIZER_FILES, 'onnx/model_q4f16.onnx'], downloadBytes: 272_737_275 + TOKENIZER_BYTES, externalData: false },
    'webgpu':     { dtype: 'q4',    files: [...TOKENIZER_FILES, 'onnx/model_q4.onnx'],    downloadBytes: 387_943_246 + TOKENIZER_BYTES, externalData: false },
    'wasm':       { dtype: 'int8',  files: [...TOKENIZER_FILES, 'onnx/model_int8.onnx'],  downloadBytes: 364_564_558 + TOKENIZER_BYTES, externalData: false },
  },
  sampling: SMOLLM2_SAMPLING,
}

// ⚠️ NOT YET TESTED in the prototype. Verify on a laptop (Phase 5) before enabling in the dropdown.
// Fallback if it misbehaves: Gemma 3 1B (onnx-community/gemma-3-1b-it-ONNX, q4f16 on WebGPU) was
// tested working on a laptop GPU (~5 tok/s), but prefer keeping the SmolLM2 family.
export const SMOLLM2_1_7B: ModelSpec = {
  key: 'smollm2-1.7b',
  id: 'HuggingFaceTB/SmolLM2-1.7B-Instruct',
  label: 'SmolLM2 1.7B',
  recommendedFor: 'laptops',
  revision: '31b70e2e869a7173562077fd711b654946d38674',
  variants: {
    'webgpu-f16': { dtype: 'q4f16', files: [...TOKENIZER_FILES, 'onnx/model_q4f16.onnx'], downloadBytes: 1_108_730_338 + TOKENIZER_BYTES, externalData: false },
    'webgpu':     { dtype: 'q4',    files: [...TOKENIZER_FILES, 'onnx/model_q4.onnx'],    downloadBytes: 1_411_969_607 + TOKENIZER_BYTES, externalData: false },
    'wasm':       { dtype: 'int8',  files: [...TOKENIZER_FILES, 'onnx/model_int8.onnx'],  downloadBytes: 1_714_119_778 + TOKENIZER_BYTES, externalData: false },
  },
  sampling: SMOLLM2_SAMPLING,
}
```

Notes:
- All six files are **single-file ONNX** (weights inside the `.onnx`), hence `externalData: false`
  (overrides `use_external_data_format` in the repo config).
- SmolLM2 int8 exports use `DynamicQuantizeLinear` + `MatMulInteger` (fast WASM SIMD kernels) and
  plain `Gather` embeddings. The q4 exports use `MatMulNBits` (fast on WebGPU, **slow on CPU**).
- 49k-token vocabulary → small per-position logits (this is why it doesn't crash where Gemma did).
- Chat template is ChatML (`<|im_start|>` … `<|im_end|>`, eos id 2); transformers.js applies it.

---

## 6. Device rules (proven)

```ts
interface DeviceCaps { device: 'webgpu' | 'wasm', shaderF16: boolean, phone: boolean, webkit: boolean, threads: number, reason: string }
```

- **phone** = `navigator.userAgentData?.mobile` || `/Android|iPhone|iPad|iPod|Mobile/` in UA ||
  (Macintosh UA && `maxTouchPoints > 1` → iPadOS).
- **webkit** = `/AppleWebKit/` && not `/Chrome|Chromium|Edg|OPR|SamsungBrowser|Android/`
  (every iOS browser is WebKit; Chrome on iOS reports `CriOS`).
- **WebKit → always CPU (`wasm`)**, even if `navigator.gpu` exists (the WebGPU bug in §3).
- Otherwise: WebGPU if `navigator.gpu.requestAdapter()` returns an adapter; `shaderF16` from
  `adapter.features.has('shader-f16')` picks `webgpu-f16` (q4f16) vs `webgpu` (q4). No adapter → `wasm`.
- **threads**: phones **2**, other devices `min(4, hardwareConcurrency)`. Only effective when the page
  is cross-origin isolated (§7.6); otherwise 1.
- Keep test overrides (handy for the test team): `?device=wasm|webgpu`, `?threads=1|2|4` (saved in
  localStorage), `?model=<key>`.
- If WebGPU load fails at runtime, the engine retries on `wasm` (same model, CPU variant).

Recommended model per device for the dropdown default: **phone or WebKit → 360M**; desktop/laptop
with WebGPU → 1.7B (once verified); desktop without WebGPU → 360M.

---

## 7. Engine layer (port from the prototype)

Port these from `reference/sync-app/` (adapt imports, paths, naming and styling to this project):

```
app/lib/llm/types.ts                 LLMEngine interface, ChatMessage, LoadProgress, GenerateStats
app/lib/llm/models.ts                model specs (replace with §5: SmolLM2 only)
app/lib/llm/device.ts                device rules (§6)
app/lib/llm/protocol.ts              worker message types
app/lib/llm/transformers-engine.ts   main-thread proxy (worker lifecycle, streaming, fallback, timeouts)
app/lib/llm/transformers.worker.ts   transformers.js in a Web Worker
app/lib/llm/index.ts                 createEngine factory + selected model (?model=)
app/lib/reveal.ts                    smooth on-screen pacing of streamed text
app/lib/crashlog.ts                  persistent diagnostic log + crash detection
app/lib/storage.ts                   navigator.storage.persist() + estimate
app/lib/markdown.ts                  tiny escape-first Markdown renderer for replies (no dependency)
app/composables/useLLM.ts            engine singleton/status for the UI
app/composables/useChat.ts           send/stream/stop/retry (replace its localStorage with §8's store)
app/composables/useStressTest.ts     hidden 30-question stability test (logo ×5 / ?stresstest=N)
app/composables/useCrashLog.ts       starts crash detection (call first, in app.vue)
app/composables/useOnline.ts         reactive navigator.onLine
app/components/ModelLoadProgress.vue download / starting / error / interrupted / unsupported card
app/components/CrashNotice.vue       "restarted unexpectedly" + Copy details
app/components/StressTestBanner.vue  test progress + Copy log
app/components/ChatMessageList.vue   message list, typing indicator, stats line (reference for UI behaviour)
app/components/ChatInput.vue         auto-growing input, Enter-to-send on desktop only, Send/Stop
app/components/AppHeader.vue         logo-tap trigger, offline badge, PWA install button
app/pages/index.vue                  how the pieces are wired together (auto-load when cached, etc.)
app/app.vue                          useCrashLog() first; theme tokens
nuxt.config.ts                       Vite worker settings + @vite-pwa/nuxt config (§10)
pwa-assets.config.ts                 icon generation (@vite-pwa/assets-generator)
package.json                         dependency versions that were tested
```

**Remove while porting (prototype-only leftovers):** Gemma specs; the WebKit "recycle worker after
each reply" workaround and `?recycle=` switch; the OPFS clean-up of the old wllama model; CPU-specific
24-token limits. Everything else below is load-bearing.

### 7.1 Interface

```ts
interface LLMEngine {
  readonly info: { modelId: string, device: 'webgpu' | 'wasm', dtype: string, downloadBytes: number }
  load(onProgress?: (p: LoadProgress) => void): Promise<void>
  generate(messages: ChatMessage[], opts?: { maxNewTokens?: number, signal?: AbortSignal }): AsyncIterable<string>
  isCached(): Promise<boolean>
  readonly lastStats: GenerateStats | null      // tokens, promptTokens, ttftMs, ms, tokensPerSecond
  pruneCache?(): Promise<void>                   // delete files not belonging to the current model
}
```

### 7.2 Worker runtime configuration (critical)

```ts
import { env } from '@huggingface/transformers'
// Self-hosted ONNX Runtime files (Vite emits hashed assets). Default would be a CDN → breaks offline.
import ortMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.mjs?url'   // GPU-capable build
import ortWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.asyncify.wasm?url'
import ortCpuMjsUrl from 'onnxruntime-web/ort-wasm-simd-threaded.mjs?url'          // plain CPU build
import ortCpuWasmUrl from 'onnxruntime-web/ort-wasm-simd-threaded.wasm?url'

env.allowLocalModels = false
env.useBrowserCache = true
// transformers.js 4.3.0 bug: tokenizer metadata is fetched without `revision` (asks for `main`) →
// cache miss → fails offline. Bake the pinned commit into every URL:
env.remotePathTemplate = `{model}/resolve/${revision}/`
// Until a service worker precaches the ORT files (PWA phase), let transformers.js cache them:
env.useWasmCache = true          // set to false once the PWA precaches /_nuxt/ort-*.{mjs,wasm}
env.backends.onnx.wasm.wasmPaths = device === 'wasm'
  ? { mjs: abs(ortCpuMjsUrl), wasm: abs(ortCpuWasmUrl) }
  : { mjs: abs(ortMjsUrl), wasm: abs(ortWasmUrl) }
env.backends.onnx.wasm.numThreads = self.crossOriginIsolated ? threads : 1
```

`onnxruntime-web` is a dependency of `@huggingface/transformers` (v4.3.0 used; it ships ORT
`1.31.0-dev`). Import paths above are listed in `onnxruntime-web`'s `exports`. Vite config:

```ts
vite: {
  worker: { format: 'es' },
  optimizeDeps: { exclude: ['@huggingface/transformers'] }, // pre-bundling breaks the worker in dev
}
```

Create the worker with `new Worker(new URL('./transformers.worker.ts', import.meta.url), { type: 'module' })`.

### 7.3 Download → cache (prefetch)

Before calling `from_pretrained`, the worker downloads every file of the selected variant into Cache
Storage bucket **`transformers-cache`** under the exact URL transformers.js uses as the key:
- Files > 32 MB are **streamed** into `cache.put` (never held fully in memory — doing so crashed phones).
- Every cached `Response` gets an **exact `Content-Length`** (transformers.js sizes its read buffer from
  it; missing/wrong values cause huge reallocations or corrupted JSON). Small files are buffered then
  stored with the real length; large ones use the CDN's `content-length` and are verified after.
- Already-cached files are skipped, so an interrupted setup never re-downloads finished files.
- Then `AutoTokenizer.from_pretrained(id, { revision })` and
  `AutoModelForCausalLM.from_pretrained(id, { revision, dtype, device, use_external_data_format: false, session_options? })`
  read purely from the cache.

### 7.4 Generation details

- **Streaming**: a `PieceStreamer` (subclass of `TextStreamer`) emits **every** decoded piece
  immediately (stock `TextStreamer` holds text until a space → bursty replies). Hold only when the
  decoded text ends with `�` (incomplete multi-byte char).
- **Smooth display**: `lib/reveal.ts` reveals incoming text at the reply's average rate with up to
  ~2 s lag (bridges short hitches). On Stop, flush immediately.
- **Stop**: `InterruptableStoppingCriteria`; the worker wraps `model.forward` to yield one macrotask
  per step (shared `MessageChannel`) — on WASM, ORT resolves steps with microtasks only, so without
  this an `interrupt` message isn't processed until the reply ends.
- **One generation at a time**: the worker queues `load`/`generate`; `interrupt` bypasses the queue.
- **History budget**: trim oldest user/assistant pairs until the prompt fits (phones 1024 tokens,
  others 1536); max new tokens phones 256, others 512. System prompt is kept.
- **Memory hygiene**: dispose output/input tensors after each reply. On WebGPU (non-WebKit only),
  `session_options.executionProviders = [{ name: 'webgpu', storageBufferCacheMode: 'lazyRelease' }]`.
- **Warm-up** on WebGPU: one 1-token generate after load (compiles shaders before the first question).
- **Init timeout**: if starting the model takes > 3 min, terminate the worker and show an error with
  Try again (low-memory phones can stall instead of failing).
- System prompt used: *"You are Afronet, a helpful assistant running offline on the user's device.
  Answer clearly and concisely."* (English-only now.)

### 7.5 Setup / crash resilience (keep)

- `useLLM` statuses: `detecting | needs-download | cached | loading | ready | error | unsupported`.
  Auto-load when cached; **a download always needs a tap** (show size, suggest Wi-Fi).
- A localStorage marker is set during load; if present on next launch the page died mid-setup → show
  "stopped while starting" + Start button instead of auto-loading into the same crash.
- `crashlog.ts`: milestone log in localStorage (survives the page being killed); a session that was
  visible and never fired `pagehide` = killed → `CrashNotice` with **Copy details**. Includes
  "alive Ns after reply" checkpoints. This is the only way to diagnose iPhone crashes without a Mac.
- `navigator.storage.persist()` on first load (granted on installed iPhone PWAs).
- Hidden **stability test** (tap the logo 5×, or `?stresstest=30`): asks 30 questions with pauses,
  thread choice (1/2/4), summary + Copy log. Consider restricting to admins/testers.

### 7.6 Cross-origin isolation (multi-threading)

Multi-threaded WASM needs `SharedArrayBuffer` → the page must be cross-origin isolated:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

On **all** responses (pages, `_nuxt/*` JS/MJS/WASM — worker scripts need it too). In a Nuxt/Nitro
app use `routeRules: { '/**': { headers: { ... } } }`. The
Hugging Face model downloads still work (they're CORS fetches). Verify in the browser:
`self.crossOriginIsolated === true` and the crash log line `worker: wasm, cross-origin isolated true,
wasm threads 2`.

If Step 0 finds a cross-origin dependency that can't be made CORS/CORP-compatible, either scope the
headers to the chat route (requires a full page load into chat, since isolation is per document) or
run single-threaded (~30% slower on phones, still fine).

---

## 8. Conversations: local-first with server sync (recommended design)

Requirement: history tied to the user's account across devices **and** chat must work offline.
Server-only storage breaks offline, so:

**Every write goes to IndexedDB immediately; a sync queue pushes it to the API when online; other
devices pull from the API.**

### 8.1 Data model (adapt names/types to this project's ORM conventions)

```
Conversation
  id            uuid  (generated on the client — needed so offline-created chats sync idempotently)
  userId        fk → user (server-side; from the auth session, never trusted from the client)
  title         string (first user message, trimmed to ~60 chars; no AI-generated titles for now)
  createdAt, updatedAt
  deletedAt?    (soft delete so deletions sync to other devices)

Message
  id              uuid (client-generated)
  conversationId  fk
  role            'user' | 'assistant'
  content         text
  status          'done' | 'stopped' | 'error'
  model?          string   (e.g. 'smollm2-360m' — which model wrote an assistant reply)
  stats?          json     ({ tokens, tokensPerSecond, ttftMs } — useful for quality/support)
  createdAt
```

Only **final** messages are stored/synced (no streaming partials). Messages are immutable once
final → syncing is append-only (no merge conflicts). Conversation `title`/`deletedAt`: last write wins
by `updatedAt`.

### 8.2 API (adapt paths/validation/response shape to existing conventions; all scoped to the session user)

```
GET    /api/conversations?since=<iso>          list (id, title, updatedAt, deletedAt) changed since
GET    /api/conversations/:id/messages         messages of one conversation (paginate if needed)
PUT    /api/conversations/:id                  upsert { title, createdAt, updatedAt, deletedAt? }
PUT    /api/conversations/:id/messages/:mid    upsert one final message
DELETE /api/conversations/:id                  soft delete (or PUT with deletedAt)
```

Server checks: authenticated; conversation belongs to the user (reject foreign ids even if the uuid
exists); content length limits; idempotent upserts (same id twice = no duplicate).

### 8.3 Client store + sync

- IndexedDB stores: `conversations`, `messages`, `outbox` (pending API ops in order). Use a tiny
  wrapper (e.g. `idb`, ~1 KB) — no heavy libraries.
- On send: write user message → IndexedDB + outbox; when the reply finishes, write assistant
  message → IndexedDB + outbox. Flush the outbox when online, after each reply, on `online` events
  and on app focus; retry with backoff; keep order per conversation.
- On app start / login (online): pull `GET /api/conversations?since=lastSync`, merge into IndexedDB;
  load a conversation's messages from the server when opened if not present locally.
- Sidebar reads from IndexedDB (instant, offline). Show a subtle "not synced yet" state if useful.
- **On logout: clear the local store** (shared devices / privacy). Store data per `userId`.
- The model only ever sees the current conversation (trimmed by the prompt budget, §7.4).

---

## 9. Model dropdown

- **Per-device setting** (localStorage), *not* per account — the right model depends on the device
  (a laptop choice synced to a phone would download 1.1 GB onto the phone).
- Default = recommended for this device (§6). Options:
  - `SmolLM2 360M (recommended for phones)`
  - `SmolLM2 1.7B (recommended for laptops)` — enable after Phase 5 verification.
  Mark the one this device uses; show the download size of each for this device's variant.
- Switching: confirm with size → terminate the current worker → load the new model (download if
  needed) → offer to delete the other model's cached files (`pruneCache`).
- Disable switching while a reply is generating.
- Record `model` on each assistant message (§8.1).

---

## 10. PWA (in scope — build after the chat works online)

Goal: installable app (Android install prompt; iPhone "Add to Home Screen") that **opens and chats
fully offline** once the model is downloaded. The prototype's setup is proven on a real iPhone; see
`reference/sync-app/nuxt.config.ts` (`pwa:` block) and `pwa-assets.config.ts`.

**Module & config** — `@vite-pwa/nuxt` (Workbox), as in the prototype, with these settings:
- `manifest`: name/short_name, `display: 'standalone'`, `start_url: '/'` (or the chat route),
  theme/background colours, icons 64/192/512 + maskable 512 (generate with
  `@vite-pwa/assets-generator` from an SVG logo; also an `apple-touch-icon` link in `<head>`).
- `workbox.globPatterns`: `**/*.{js,mjs,css,html,ico,png,svg,webmanifest,wasm}` — this precaches the
  self-hosted ONNX Runtime files (`_nuxt/ort-wasm-simd-threaded*.{mjs,wasm}`, ~41 MB total).
- `workbox.maximumFileSizeToCacheInBytes: 40 * 1024 * 1024` (the GPU-capable ORT wasm is ~27 MB).
- **Never precache model files** — transformers.js keeps them in Cache Storage itself.
- `navigateFallback` to the app shell so offline navigations load; `cleanupOutdatedCaches: true`.
- `devOptions.enabled: false` (the service worker only runs in production builds; test with a
  production build + preview).
- **`registerType: 'prompt'`, not `'autoUpdate'`** — the prototype used autoUpdate and every new
  release reloaded the page, wiping an in-progress reply. Show "Update available — tap to refresh"
  (via `$pwa.needRefresh` / `updateServiceWorker()`), and don't auto-apply while generating.
- Install button in the header when `$pwa.showInstallPrompt` (Android/Chromium); short "Share → Add
  to Home Screen" hint for iPhone.
- **After the PWA precaches ORT, set `env.useWasmCache = false`** in the worker (avoid caching the
  same ~41 MB twice).

**Things that interact with the rest of this app — check during Step 0 and handle here:**
1. **SSR + offline**: if this project renders pages on the server, an offline navigation can't reach
   the server. Make the chat area (and whatever it needs to start offline) client-rendered, e.g.
   `routeRules: { '/chat/**': { ssr: false } }`, and make `navigateFallback` point to an app shell
   that can boot without the server. Explain the chosen approach to the developer.
2. **Auth while offline**: route middleware or a session check that calls the API will fail offline
   and bounce the user to login. Cache the last authenticated user locally (cleared on logout) and
   treat them as signed in while offline; re-validate when back online. Never cache tokens anywhere
   less safe than the existing auth already does.
3. **API responses**: do not let the service worker cache authenticated API responses (privacy +
   stale data). Offline data comes from IndexedDB (§8), not from SW caches.
4. **COOP/COEP on cached documents**: Workbox stores the original response headers, so the HTML/JS it
   serves keeps COOP/COEP as long as the server sent them. Verify `self.crossOriginIsolated === true`
   when the installed app is opened offline (crash log line `worker: … cross-origin isolated true`).
5. **Persistent storage**: call `navigator.storage.persist()`; installed iPhone PWAs get it granted
   (seen in testing), which protects the model from eviction.
6. **iPhone note**: home-screen apps have storage separate from Safari — users who downloaded the
   model in Safari will download it again after installing. Mention this in the UI hint.

✅ Test: install on iPhone + Android → airplane mode → close app → reopen → sign-in state kept →
open a past conversation → ask a question → reply on device → reconnect → new messages sync.

---

## 11. Offline hardening (Phase 7)

1. **Storage check before download** (`navigator.storage.estimate()`): "needs about 370 MB free";
   catch `QuotaExceededError` from `cache.put` with a clear message.
2. **Interrupted download**: clear "Download interrupted — tap to continue"; finished files are kept.
3. **Model evicted by the OS** (iOS can clear site storage of non-installed web apps after weeks of
   non-use): if the model was ready before and is now missing, say so and offer re-download.
4. **About / Storage panel**: model + device path (CPU/GPU, threads), storage used, **Delete model**,
   Copy log, licence credits (SmolLM2 — Apache 2.0, Hugging Face; transformers.js — Apache 2.0;
   ONNX Runtime — MIT).
5. Offline badge in the header; disable Download while offline.

---

## 12. Phases (test after each)

1. **Step 0 report** (§ Step 0).
2. **Engine port**: §7 behind `LLMEngine`, temporary minimal chat on the existing chat page.
   ✅ Laptop: download → reply. ✅ iPhone (Safari tab or installed): reply on CPU, 2 threads,
   cross-origin isolated true.
3. **Chat UI integration**: existing chat area + sidebar wired to `useChat`; new chat, select,
   streaming + reveal, stop, retry, setup card, crash notice. Local (IndexedDB) storage only.
   ✅ Hidden stability test 30/30 on iPhone (expect ~20–25 tok/s, first word ~2–3 s).
4. **Server sync**: models/migrations, API (§8.2), outbox sync, pull on login, logout clears local.
   ✅ Chat offline → reconnect → appears on a second device. ✅ Foreign conversation ids rejected.
5. **Model dropdown + 1.7B verification**: test SmolLM2 1.7B on a laptop with WebGPU (download,
   speed, answer quality, 30-question test). Enable it in the dropdown only if it passes; otherwise
   keep 360M only (or evaluate Gemma 3 1B for laptops).
6. **PWA** (§10): manifest, icons, service worker precaching the app shell + ORT files, update
   prompt, install button, offline boot (SSR + auth-offline handling), `useWasmCache = false`.
   ✅ The §10 offline test on iPhone and Android.
7. **Offline hardening** (§11) + real-device checklist: first download, airplane-mode relaunch,
   low storage, interrupted download, app update during a chat, 30 questions, Android (GPU path) and
   a low-end 4 GB phone.

---

## 13. Reference

- Prototype (working reference): the `sync-app` project, files in `reference/sync-app/`.
- Key issues: onnxruntime#26827, onnxruntime#27584 (WebKit memory after WebGPU inference);
  transformers.js 4.3.0 tokenizer `revision` bug (§7.2).
- Research on mobile browser memory limits: "Llamas on the Web" (arXiv 2605.20706) — iOS Safari per-tab
  limits around 500 MB.
- Test overrides: `?device=wasm|webgpu`, `?threads=1|2|4`, `?model=<key>`, `?stresstest=30`.
