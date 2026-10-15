<!-- app/pages/chat/brain-test.vue -->

<!--
  Correction test for the personal brain: does the model on this device use a correction it is
  given, also for reworded questions, without the correction leaking into look-alike questions?

  Runs the questions in data/brainTest.js under four conditions with the real chat engine and
  system prompt. Results are kept on this device per model (so a crash loses nothing and a run
  resumes where it stopped) and download as CSV. Under /chat so it gets the same cross-origin
  isolation, and so the same WASM threads, as the chat.
-->
<template>
  <div class="min-h-[100dvh] bg-[#f7f7f4] px-4 py-6">
    <div class="mx-auto w-full max-w-4xl space-y-5">
      <header>
        <h1 class="text-[20px] font-semibold text-[#121614]">Brain correction test</h1>
        <p class="mt-1 text-[13px] text-[#606863]">
          {{ model?.label ?? '…' }} · {{ info ? `${info.device} ${info.dtype}` : 'detecting' }}
          <span v-if="caps"> · {{ caps.threads }} threads</span> · status: {{ status }}
        </p>
        <p v-if="error" class="mt-1 text-[13px] text-[#b22c26]">{{ error }}</p>
      </header>

      <section class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <p class="text-[13px] font-semibold text-[#121614]">Conditions</p>
        <div class="mt-2 grid gap-2 sm:grid-cols-2">
          <label v-for="c in CONDITIONS" :key="c.key" class="flex items-start gap-2 text-[13px] text-[#121614]">
            <input v-model="chosen" type="checkbox" :value="c.key" :disabled="running" class="mt-0.5" />
            <span><b>{{ c.key }}. {{ c.label }}</b> <span class="text-[#606863]">— {{ c.hint }}</span></span>
          </label>
        </div>

        <label class="mt-4 flex items-center gap-2 text-[13px] text-[#121614]">
          Repeats
          <input
            v-model.number="repeats"
            type="number"
            min="1"
            max="5"
            :disabled="running"
            class="w-16 rounded-lg border border-[#e4e4de] px-2 py-1"
          />
          <span class="text-[#606863]">{{ testItems.length }} items · {{ plan.length }} replies · {{ doneCount }} done</span>
        </label>

        <div class="mt-4 flex flex-wrap gap-2">
          <UiButton v-if="status !== 'ready'" :disabled="status === 'loading' || status === 'detecting'" @click="llm.load()">
            {{ status === 'loading' ? `Loading… ${Math.floor(progress?.percent ?? 0)}%` : 'Load model' }}
          </UiButton>
          <UiButton v-if="!running" :disabled="status !== 'ready' || !plan.length || doneCount === plan.length" @click="run">
            {{ doneCount ? 'Resume' : 'Start' }}
          </UiButton>
          <UiButton v-else variant="danger" @click="stop">Stop</UiButton>
          <UiButton variant="secondary" :disabled="!results.length" @click="downloadCsv">Download CSV</UiButton>
          <UiButton variant="ghost" :disabled="running || !results.length" @click="clearResults">
            {{ confirmClear ? 'Tap again to clear' : 'Clear results' }}
          </UiButton>
        </div>

        <div v-if="plan.length" class="mt-4 h-1.5 overflow-hidden rounded-full bg-[#f7f7f4]">
          <div class="h-full bg-[#0b5d3e] transition-[width]" :style="{ width: `${(doneCount / plan.length) * 100}%` }" />
        </div>
        <p v-if="running && current" class="mt-2 truncate text-[12px] text-[#606863]">Asking: {{ current }}</p>
      </section>

      <section class="overflow-x-auto rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <p class="text-[13px] font-semibold text-[#121614]">Results by condition</p>
        <p class="mt-1 text-[12px] text-[#606863]">
          Pass: correct ≥ {{ pct(PASS_MARK.correct) }} and leaks ≤ {{ pct(PASS_MARK.leak) }}.
          "Baseline-wrong" counts only items the model got wrong without help (needs condition A).
          Mixed and unclear replies count as not correct until reviewed below.
        </p>
        <table class="mt-3 w-full min-w-[640px] text-left text-[12px]">
          <thead class="text-[#606863]">
            <tr>
              <th class="py-1.5 pr-3 font-medium">Condition</th>
              <th class="py-1.5 pr-3 font-medium">Original</th>
              <th class="py-1.5 pr-3 font-medium">Reworded</th>
              <th class="py-1.5 pr-3 font-medium">All correct</th>
              <th class="py-1.5 pr-3 font-medium">Baseline-wrong</th>
              <th class="py-1.5 pr-3 font-medium">Leaks</th>
              <th class="py-1.5 pr-3 font-medium">To review</th>
              <th class="py-1.5 pr-3 font-medium">Prompt tok</th>
              <th class="py-1.5 pr-3 font-medium">tok/s</th>
              <th class="py-1.5 font-medium">Pass</th>
            </tr>
          </thead>
          <tbody class="text-[#121614]">
            <tr v-for="s in summary" :key="s.key" class="border-t border-[#e4e4de]">
              <td class="py-1.5 pr-3">{{ s.key }}. {{ s.label }}</td>
              <td class="py-1.5 pr-3">{{ s.original }}</td>
              <td class="py-1.5 pr-3">{{ s.reworded }}</td>
              <td class="py-1.5 pr-3 font-semibold">{{ s.correct }}</td>
              <td class="py-1.5 pr-3">{{ s.baselineWrong }}</td>
              <td class="py-1.5 pr-3">{{ s.leaks }}</td>
              <td class="py-1.5 pr-3">{{ s.review }}</td>
              <td class="py-1.5 pr-3">{{ s.promptTokens }}</td>
              <td class="py-1.5 pr-3">{{ s.tps }}</td>
              <td class="py-1.5" :class="s.pass === 'yes' ? 'text-[#0b5d3e]' : s.pass === 'no' ? 'text-[#b22c26]' : ''">{{ s.pass }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section v-if="toReview.length" class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <p class="text-[13px] font-semibold text-[#121614]">Needs a person ({{ toReview.length }})</p>
        <p class="mt-1 text-[12px] text-[#606863]">The reply named both answers, or neither. Decide each one.</p>
        <div v-for="r in toReview.slice(0, 20)" :key="r.key" class="mt-3 border-t border-[#e4e4de] pt-3">
          <p class="text-[12px] text-[#606863]">{{ r.condition }} · {{ r.kind }} · expected: {{ expected(r) }}</p>
          <p class="text-[13px] font-medium text-[#121614]">{{ r.question }}</p>
          <p class="mt-1 whitespace-pre-wrap text-[13px] text-[#121614]">{{ r.reply }}</p>
          <div class="mt-2 flex gap-2">
            <UiButton size="sm" variant="secondary" @click="mark(r, 'correct')">Correct</UiButton>
            <UiButton size="sm" variant="secondary" @click="mark(r, 'wrong')">Wrong</UiButton>
          </div>
        </div>
      </section>

      <section v-if="results.length" class="rounded-2xl border border-[#e4e4de] bg-[#ffffff] p-5">
        <p class="text-[13px] font-semibold text-[#121614]">Latest replies</p>
        <div v-for="r in results.slice(-10).reverse()" :key="r.key" class="mt-3 border-t border-[#e4e4de] pt-3">
          <p class="text-[12px] text-[#606863]">{{ r.condition }} · {{ r.kind }} · {{ r.outcome }}</p>
          <p class="text-[13px] font-medium text-[#121614]">{{ r.question }}</p>
          <p class="mt-1 whitespace-pre-wrap text-[13px] text-[#121614]">{{ r.reply }}</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { SYSTEM_PROMPT } from '~/composables/useChat'
import { PASS_MARK, testItems } from '~/data/brainTest'

definePageMeta({ layout: 'blank' })
useHead({ title: 'Brain test · Afronet' })

const CONDITIONS = [
  { key: 'A', label: 'Baseline', hint: 'no correction, as chats work today' },
  { key: 'B', label: 'Fact in instructions', hint: 'the correction added to the system prompt' },
  { key: 'C', label: 'Earlier in chat', hint: 'the user gave the correction earlier in the conversation' },
  { key: 'D', label: 'Fact + noise', hint: 'the correction plus one unrelated fact' },
]
/** Short factual answers; keeps a full run on a phone under an hour. */
const MAX_NEW_TOKENS = 64

const llm = useLLM()
const { status, info, caps, model, progress, error } = llm

const chosen = ref(CONDITIONS.map(c => c.key))
const repeats = ref(3)
const results = ref([])
const running = ref(false)
const current = ref('')
const confirmClear = ref(false)
let controller = null

// --- the plan -----------------------------------------------------------------------------

function questionsOf(item) {
  return [
    { kind: 'original', text: item.question },
    ...item.rewordings.map(text => ({ kind: 'reworded', text })),
    ...item.lookalikes.map(text => ({ kind: 'lookalike', text })),
  ]
}

/** Repeats outermost, so a run stopped halfway still covers every condition evenly. */
const plan = computed(() => {
  const tasks = []
  for (let rep = 1; rep <= repeats.value; rep++) {
    for (const condition of CONDITIONS.map(c => c.key).filter(k => chosen.value.includes(k))) {
      testItems.forEach((item, index) => {
        questionsOf(item).forEach((q, qi) => {
          tasks.push({ key: `${condition}|${item.id}|${q.kind}|${qi}|${rep}`, condition, item, index, rep, ...q })
        })
      })
    }
  }
  return tasks
})

const doneCount = computed(() => {
  const done = new Set(results.value.map(r => r.key))
  return plan.value.filter(t => done.has(t.key)).length
})

function messagesFor(task) {
  const system = { role: 'system', content: SYSTEM_PROMPT }
  const question = { role: 'user', content: task.text }
  const facts = list => ({ role: 'system', content: `${SYSTEM_PROMPT}\n\nVerified facts:\n${list.map(f => `- ${f}`).join('\n')}` })

  if (task.condition === 'B') return [facts([task.item.fact]), question]
  if (task.condition === 'C') {
    return [
      system,
      { role: 'user', content: `Correction: ${task.item.fact}` },
      { role: 'assistant', content: 'Thank you for the correction. I will use it from now on.' },
      question,
    ]
  }
  if (task.condition === 'D') {
    const noise = testItems[(task.index + 1) % testItems.length].fact
    return [facts([task.item.fact, noise]), question]
  }
  return [system, question]
}

// --- scoring ------------------------------------------------------------------------------

const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const mentions = (reply, words = []) => words.some(w => norm(reply).includes(norm(w)))

function score(item, kind, reply) {
  if (kind === 'lookalike') return mentions(reply, item.answer) ? 'leak' : 'ok'
  const right = mentions(reply, item.answer)
  const bad = mentions(reply, item.wrong)
  if (right && bad) return 'mixed'
  if (right) return 'correct'
  return bad ? 'wrong' : 'unclear'
}

const expected = r => {
  const item = testItems.find(i => i.id === r.itemId)
  return r.kind === 'lookalike' ? `not "${item?.answer[0]}"` : item?.answer.join(' / ')
}

// --- running ------------------------------------------------------------------------------

async function run() {
  await llm.load()
  if (status.value !== 'ready') return

  running.value = true
  confirmClear.value = false
  controller = new AbortController()
  let wakeLock = null
  try { wakeLock = await navigator.wakeLock?.request('screen') }
  catch { /* the screen may sleep; the run pauses and resumes with the page */ }

  try {
    const engine = llm.engine()
    const done = new Set(results.value.map(r => r.key))
    for (const task of plan.value) {
      if (controller.signal.aborted) break
      if (done.has(task.key)) continue
      current.value = task.text

      let reply = ''
      let outcome
      try {
        for await (const piece of engine.generate(messagesFor(task), { maxNewTokens: MAX_NEW_TOKENS, signal: controller.signal })) {
          reply += piece
        }
        reply = reply.trim()
        outcome = score(task.item, task.kind, reply)
      }
      catch (err) {
        reply = err instanceof Error ? err.message : String(err)
        outcome = 'error'
      }
      // A stopped reply is half an answer: don't score it.
      if (controller.signal.aborted) break

      const stats = engine.lastStats
      results.value.push({
        key: task.key,
        model: model.value?.label,
        device: info.value ? `${info.value.device} ${info.value.dtype}` : '',
        condition: task.condition,
        itemId: task.item.id,
        kind: task.kind,
        rep: task.rep,
        question: task.text,
        reply,
        outcome,
        promptTokens: stats?.promptTokens ?? 0,
        tokensPerSecond: stats ? Number(stats.tokensPerSecond.toFixed(1)) : 0,
        ttftMs: stats ? Math.round(stats.ttftMs) : 0,
      })
      save()
      if (outcome === 'error') break // the engine is in trouble; don't fill the table with errors
    }
  }
  finally {
    running.value = false
    current.value = ''
    controller = null
    wakeLock?.release().catch(() => {})
  }
}

function stop() {
  controller?.abort()
}

function mark(r, outcome) {
  r.outcome = outcome
  r.reviewed = true
  save()
}

// --- summary ------------------------------------------------------------------------------

const pct = x => `${Math.round(x * 100)}%`
const rate = (rows, outcome) => (rows.length ? pct(rows.filter(r => r.outcome === outcome).length / rows.length) : '—')
const avg = (rows, field) => (rows.length ? (rows.reduce((s, r) => s + r[field], 0) / rows.length).toFixed(field === 'promptTokens' ? 0 : 1) : '—')

/** Items the model answers wrongly on its own: condition A, original question, mostly not correct. */
const baselineWrongIds = computed(() => {
  const ids = new Set()
  for (const item of testItems) {
    const rows = results.value.filter(r => r.condition === 'A' && r.itemId === item.id && r.kind === 'original' && r.outcome !== 'error')
    if (rows.length && rows.filter(r => r.outcome === 'correct').length / rows.length < 0.5) ids.add(item.id)
  }
  return ids
})

const summary = computed(() => CONDITIONS.filter(c => results.value.some(r => r.condition === c.key)).map((c) => {
  const rows = results.value.filter(r => r.condition === c.key && r.outcome !== 'error')
  const answers = rows.filter(r => r.kind !== 'lookalike')
  const lookalikes = rows.filter(r => r.kind === 'lookalike')
  const correctShare = answers.length ? answers.filter(r => r.outcome === 'correct').length / answers.length : 0
  const leakShare = lookalikes.length ? lookalikes.filter(r => r.outcome === 'leak').length / lookalikes.length : 0
  return {
    key: c.key,
    label: c.label,
    original: rate(answers.filter(r => r.kind === 'original'), 'correct'),
    reworded: rate(answers.filter(r => r.kind === 'reworded'), 'correct'),
    correct: rate(answers, 'correct'),
    baselineWrong: rate(answers.filter(r => baselineWrongIds.value.has(r.itemId)), 'correct'),
    leaks: rate(lookalikes, 'leak'),
    review: answers.filter(r => r.outcome === 'mixed' || r.outcome === 'unclear').length,
    promptTokens: avg(rows, 'promptTokens'),
    tps: avg(rows, 'tokensPerSecond'),
    // The baseline has no correction to follow, so pass/fail means nothing there.
    pass: c.key === 'A' || !answers.length ? '—' : correctShare >= PASS_MARK.correct && leakShare <= PASS_MARK.leak ? 'yes' : 'no',
  }
}))

const toReview = computed(() => results.value.filter(r => r.outcome === 'mixed' || r.outcome === 'unclear'))

// --- saving and export ----------------------------------------------------------------------

/** Per model, so runs of the small and the large model can be compared side by side. */
const storageKey = computed(() => `afronet:brain-test:${model.value?.key ?? 'none'}`)

function save() {
  try { localStorage.setItem(storageKey.value, JSON.stringify(results.value)) }
  catch { /* storage full or unavailable: results stay on screen; download the CSV */ }
}

watch(storageKey, (key) => {
  try { results.value = JSON.parse(localStorage.getItem(key) ?? '[]') }
  catch { results.value = [] }
}, { immediate: true })

function clearResults() {
  if (!confirmClear.value) {
    confirmClear.value = true
    return
  }
  confirmClear.value = false
  results.value = []
  save()
}

function downloadCsv() {
  const fields = ['model', 'device', 'condition', 'itemId', 'kind', 'rep', 'question', 'reply', 'outcome', 'reviewed', 'promptTokens', 'tokensPerSecond', 'ttftMs']
  const cell = v => `"${String(v ?? '').replace(/"/g, '""')}"`
  const csv = [fields.join(','), ...results.value.map(r => fields.map(f => cell(r[f])).join(','))].join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
  a.download = `brain-test-${model.value?.key ?? 'model'}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>
