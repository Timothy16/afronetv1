# Personal Brain

How AfroIntel remembers user corrections. Read this before changing anything in the chat's answer
path, the brain storage, or sync.

## What it does

When the model answers wrongly, the user taps the pencil under the reply and types the right
answer. The correction is saved in that user's **personal brain**. Next time the same question is
asked, the saved answer is shown instead of the model's. Corrections work offline and sync to the
user's account (African ID), so they come back on any device.

## Core rules (keep these)

1. **The brain is separate from the model.** The model is never retrained or modified. Corrections
   live in their own storage, so switching models (`smollm2-360m` ↔ `smollm2-1.7b`) or deleting
   a model's files never touches them. Model files are in Cache Storage (`transformers-cache`);
   the brain is in IndexedDB. Never store brain data in the model cache: `pruneCache()` deletes
   unknown entries there.
2. **A strong match is answered from the brain directly, not by the model.** We tested putting the
   correction in the model's prompt: accuracy only reached ~85%, and the 360M model ignored some
   corrections every time ("Pope Francis" 9/9 despite being told "Pope Leo XIV"). So the saved
   answer is shown verbatim.
3. **Prefer missing a match over a false match.** A missed match just means the model answers as
   before. A false match shows a saved answer to a different question, which is worse than the
   original mistake. Matching is deliberately strict.
4. **Personal only, for now.** Each user sees only their own corrections. A shared brain (one
   user's correction helping everyone) is planned but NOT built: it needs verification so one
   person can't teach everyone something false.
5. **Local-first.** Every write lands in IndexedDB immediately and is queued in the outbox; sync
   is never required for the feature to work.

## How a question is answered

`send()` in `app/composables/useChat.ts`:

```
question → useBrain().lookup(question) → bestMatch() over the user's entries
  strong (score ≥ 0.8)  → reply = saved answer, source: 'brain', model: "From your brain · saved <date>"
                          the model is not called
  partial (≥ 0.5)       → model answers; the correction is added to the system prompt as
                          "Verified facts: - When asked "<q>", the correct answer is: <a>"
  none                  → model answers as normal
```

`send(text, { skipBrain: true })` bypasses the brain. The "Not what I asked" link under a brain
answer uses it (it asks the same question again as a new turn, so nothing is deleted).

## How a correction is saved

`app/components/Ai/Message.vue`: a pencil button under assistant replies (status `done` or
`stopped`) that have a preceding user question (`question` prop, passed by `ChatScreen.vue`).
It opens an inline form → `useBrain().saveCorrection(question, answer)`:

- The category is detected automatically by `detectCategory(question, answer)`. Users never pick it.
- If the question strongly matches an existing entry, that entry is **updated** (no duplicates).
- The entry is saved to IndexedDB, queued in the outbox (`kind: 'brain'`), and a sync is scheduled.

## Files

| File | Role |
| --- | --- |
| `app/lib/brainMatch.ts` | Pure matching: `normalize`, `terms`, `similarity`, `bestMatch`, thresholds `STRONG`/`PARTIAL` |
| `app/composables/useBrain.ts` | Brain state + actions: `load`, `saveCorrection`, `update`, `remove`, `reset`, `lookup`; `CATEGORIES`, `detectCategory` |
| `app/lib/chatStore.ts` | IndexedDB: `brain` store, `BrainEntry` type, `listBrain`, `getBrainEntry`, `putBrainEntry`; outbox `kind: 'brain'`; `clearUserData` also clears the brain |
| `app/composables/useChat.ts` | Brain lookup before generation; `source: 'brain'` on messages; `SYSTEM_PROMPT` is exported |
| `app/composables/useChatSync.ts` | Push brain ops (`pushOne`), pull brain changes (`pullBrain`), separate `since` bookmark |
| `app/composables/useConversations.ts` | `clearLocal` (sign-out) also calls `useBrain().reset()` |
| `app/components/Ai/Message.vue` | Pencil + correction form, brain footer, "Not what I asked" |
| `app/components/Ai/BrainPanel.vue` | "My brain" dialog (book icon in the chat header) |
| `app/components/Ai/ChatScreen.vue` | Passes `question`/`isLast`/`generating` to messages; mounts `AiBrainPanel` |
| `app/components/Ai/Icon.vue` | Icons `edit`, `book`, `trash`, `search` (the /chat page can't load Font Awesome) |
| `server/models/AfronetBrainEntry.model.ts` | Mongo model (collection `afronetbrainentries`) |
| `server/api/brain/index.get.ts` | `GET /api/brain?since=<iso>`: the user's entries, tombstones included |
| `server/api/brain/[id].put.ts` | `PUT /api/brain/:id`: upsert; newer `updatedAt` wins |
| `server/utils/chatSync.ts` | `serializeBrainEntry` |
| `scripts/brain-match-check.ts` | Measures matching on the test questions (no model needed) |
| `app/pages/chat/brain-test.vue` + `app/data/brainTest.js` | Model correction test page and its question set |

## Data model

```ts
interface BrainEntry {
  id: string            // uuid generated on the device; also the Mongo _id
  userId: string
  question: string
  answer: string
  category: string      // one of CATEGORIES, auto-detected
  createdAt: string     // ISO
  updatedAt: string     // ISO; shown to the user ("saved 12 Oct 2026"); decides sync conflicts
  deletedAt: string | null  // soft delete so deletions reach other devices
}
```

IndexedDB database `afronet`, **version 2** (v1 had `conversations`, `messages`, `outbox`; v2
added `brain`, keyPath `id`, index `userId`). If you add a store, bump `DB_VERSION` and add it in
`onupgradeneeded` with a `contains` check. A tab still open on an older version can block the
upgrade; `onversionchange` closes the connection so newer tabs can upgrade.

`StoredMessage` / `UiMessage` have an optional `source?: 'brain'`. It is local only: the server's
message endpoint does not store it (the `model` label "From your brain · saved …" does sync).

## Matching (`app/lib/brainMatch.ts`)

- Normalise: lowercase, strip accents, apply synonyms (`usa`/`us`/`america`/`united states` →
  `usa`; `president`/`leads`/`leader`/`heads` → `leader`; `money` → `currency`; `ivory coast` →
  `cotedivoire`; `afcon`; `au`; `headquarters`).
- Remove stopwords (question words, articles, "current/now/today", "city", "country", "used").
  Tense words like `was` are **kept** on purpose: "who was…" ≠ "who is…".
- Score = Jaccard overlap of content words. **Different numbers or years → score 0**
  ("president in 2010" never matches "president").
- `STRONG = 0.8`, `PARTIAL = 0.5`.

Results on the 20 test items (`node scripts/brain-match-check.ts`): look-alikes strong-matched
0/20, rewordings strong 73% / partial 18% / missed 10%. The synonym list was tuned on these same
questions, so real-world matching is lower. **Run the script after any change to the matcher; it
exits non-zero if a look-alike or another item's question matches strongly.** Add new test cases
to `app/data/brainTest.js` (`rewordings` should match, `lookalikes` must not).

Known misses (by design, fall back to the model): "Who leads the Catholic Church?" vs "Who is the
current pope?"; "seat of government" vs "capital". The planned fix is a small embedding model,
not a longer synonym list.

## Categories

`CATEGORIES` in `useBrain.ts`: General, Politics & leaders, Geography, Money & business, Sports,
Religion, Health, Science & technology, History. `detectCategory(question, answer)` counts keyword
hits per category; question hits count double; ties go to the earlier (more specific) category in
`CATEGORY_HINTS`; no hits → General. Recomputed whenever an entry is edited.

## Sync through African ID

Same pattern as conversations (see `useChatSync.ts`):

- **Push:** every save, edit or delete writes the entry and queues `{ kind: 'brain', id }`.
  `pushOne` reads the current entry and `PUT`s it. Ops are deduped per item.
- **Pull:** `pullBrain` calls `GET /api/brain?since=<bookmark>`; with an empty local brain it pulls
  everything. Remote wins only if its `updatedAt` is newer. Tombstones are stored locally and
  filtered out of lookup and the panel.
- **Bookmark key:** `afronet:lastsync:brain:<userId>` (chats use `afronet:lastsync:<userId>`);
  `forgetSince` clears both.
- **Sign-out:** `clearLocal` keeps everything if the outbox still has unsent items; otherwise
  `clearUserData` removes chats **and** brain entries from the device. They return from the
  account at the next sign-in.
- **Server:** ownership comes from the session only. Another user's id answers 404. Question
  ≤ 2,000 chars, answer ≤ `MAX_CONTENT_LENGTH`.

## UI

- **Correction form** (`Message.vue`): textarea "What is the right answer?", then Cancel and Save
  to my brain. After saving, a note shows the detected category.
- **Brain answer footer:** "From your brain · saved <date>", plus "Not what I asked" (on the last
  message only).
- **My brain** (`BrainPanel.vue`), modelled on ChatGPT's "Manage memories": a centred dialog
  (full screen on phones), search, category filter chips, a divided list (question, answer,
  "category · date"), edit and delete per row (delete confirms inline; never use `confirm()`),
  and a footer showing sync status. It is teleported to `<body>`; Escape closes it.

## Testing tools

- `node scripts/brain-match-check.ts`: matching quality, seconds, no model.
- `/chat/brain-test`: runs the question set through the real engine under 4 conditions (A no
  correction, B correction in system prompt, C correction earlier in chat, D correction plus
  noise). Results are saved per model in localStorage and exported as CSV. It must stay under
  `/chat` to get cross-origin isolation (WASM threads).
- Last run (360M, WebGPU q4, 1 repeat): correct A 32%, B 82%, C 85%, D 87%; none passed the 90% bar.
  This was not run on a phone (CPU/int8 path).

## Known limits and next steps

- Keyword matching misses very different wordings. Next: an embedding model in the Model Store
  (capability `embedding`).
- Facts go stale (presidents, popes). The saved date is shown, but there is no expiry or review yet.
- The model test hasn't been run on a phone.
- Shared brain not built. When it is, corrections must be verified (several users agreeing, or a
  reviewer) before reaching everyone.
- `source: 'brain'` is not synced, so on another device "Not what I asked" isn't offered for old
  brain answers.
- An older, unrelated bug: `retry()` removes messages from the screen but not from IndexedDB, so
  they reappear after a reload.

## Background

This is the first step of the Model / Brain / Personal Intelligence plan (Model Store + Brain
Store + Orchestrator + personal memory). Approach chosen after research: MemPrompt and TeachMe
(store corrections, retrieve for similar questions, no retraining), AutoGen Teachable Agents,
ChatGPT Memory (management UI), and semantic caching (return the stored answer on a close match).
A caution from Xie et al., ICLR 2024: models tend to fall back to what they already "believe",
which our test confirmed.
