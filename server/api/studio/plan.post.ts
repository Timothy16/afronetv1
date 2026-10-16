// server/api/studio/plan.post.ts
//
// Asks the model what an app would take to build, before building it.
//
// Every build goes through here first. It costs the developer tokens, and what it returns is
// what sets the budget for the build that follows — which is the whole point: a build sized to
// the app rather than to a flat ceiling it was never told about.
import { planApp } from '../../utils/planApp'
import { balanceFor, MAX_PROMPT_CHARS, requireTokens } from '../../utils/tokenAllowance'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const body = await readBody(event)

    // The same bound as a generation, for the same reason: it is what makes the cost of this
    // call a ceiling rather than an estimate.
    const prompt = String(body?.prompt ?? '').trim().slice(0, MAX_PROMPT_CHARS)
    if (prompt.length < 15) {
        throw createError({ statusCode: 400, message: 'Describe the app in a bit more detail' })
    }

    const name = String(body?.name ?? '').trim().slice(0, 60) || 'My App'

    await requireTokens(session.userId)

    const plan = await planApp({ prompt, name, userId: session.userId })

    // Read back rather than worked out here. The plan has just been paid for, and the screen
    // that shows it compares its estimate against what is left afterwards.
    const tokens = await balanceFor(session.userId)

    return { success: true, data: { ...plan, tokens } }
})
