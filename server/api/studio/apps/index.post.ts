// server/api/studio/apps/index.post.ts
//
// Creates a build from the wizard's answers, and writes the app.
//
// The server decides what a new build looks like — its id, its version, its starting status and
// its config — rather than accepting a record the browser assembled. The browser sends the
// answers; this turns them into a build and then asks the model for its code.
//
// Generation happens here and only here. The files are stored on the build, so every preview,
// every download and every run afterwards serves the same app with the same checksum, without
// spending anything further.
import { AfronetAppGeneration } from '../../../models/AfronetAppGeneration.model'
import { AfronetDevApp } from '../../../models/AfronetDevApp.model'
import { buildFromWizard } from '../../../utils/devApps'
import { generateApp } from '../../../utils/generateApp'
import { filesToDoc, sizeOf } from '../../../utils/packageFormat'
import { MAX_PROMPT_CHARS, requireTokens } from '../../../utils/tokenAllowance'
import { validateApp } from '../../../utils/validateApp'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const answers = await readBody(event)

    // Bounded at both ends. The lower bound is so there is something to build from; the upper
    // one is what makes MAX_PER_GENERATION a real ceiling rather than an estimate, since an
    // unbounded description would make the input cost unbounded with it.
    const prompt = String(answers?.prompt ?? '').trim().slice(0, MAX_PROMPT_CHARS)
    if (prompt.length < 15) {
        throw createError({ statusCode: 400, message: 'Describe the app in a bit more detail' })
    }

    // Before anything is spent. The balance has to cover the most a generation can take, so
    // it can never go negative — and a refusal here costs nothing and says when it lifts.
    await requireTokens(session.userId)

    const doc: any = { ...buildFromWizard(answers), userId: session.userId }

    // If this throws, no build is created. A draft with no code is a dead record a developer
    // would have to find and delete themselves.
    const generated = await generateApp({
        prompt,
        name: doc.name,
        config: doc.config,
        userId: session.userId,
        devAppId: doc._id,
        kind: 'create',
    })

    // Checked here as well as at publish. The same gate either way, but a developer who hears
    // "this app reaches the network, which the sandbox blocks" thirty seconds after describing
    // it can describe it differently — rather than finding out after filling in a listing and
    // wondering why the preview was blank.
    const validation = validateApp(generated.files, 'index.html', {
        savesProgress: doc.config?.saveProgress !== false,
    })
    if (!validation.ok) {
        throw createError({
            statusCode: 422,
            message: `That app came back in a shape Afronet cannot run: ${validation.findings
                .filter((f) => f.fatal)
                .map((f) => f.message)
                .join(' ')}`,
            data: { findings: validation.findings },
        })
    }

    doc.files = filesToDoc(generated.files)
    doc.generatedAt = today()

    // The real measured size, not an estimate from the token count.
    doc.packageMB = Math.max(0.01, Math.round((sizeOf(generated.files) / 1024 / 1024) * 100) / 100)
    doc.installedMB = Math.round(doc.packageMB * 1.5 * 100) / 100

    try {
        await AfronetDevApp.create(doc)
    } catch (e: any) {
        // The app was written and paid for, and then could not be saved. That is our failure,
        // not the developer's, so the generation is struck from the ledger rather than counted
        // against an allowance for an app they never received.
        await AfronetAppGeneration.deleteMany({ devAppId: doc._id }).catch(() => {})
        throw createError({
            statusCode: 500,
            message: `The app was generated but could not be saved, so it has not been counted. ${e?.message ?? ''}`.trim(),
        })
    }

    return {
        success: true,
        data: { ...serializeAfronetDevApp(doc), usage: generated.usage },
    }
})
