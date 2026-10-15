// server/api/apps/reports.post.ts
//
// Receiving a report about an app or a review.
//
// Nobody reads these yet — there is no trust and safety queue. What there is, is a record, so
// that when someone does read them the reports are there. The dialog previously answered with
// the same invented reference every time and kept nothing at all, which told a person their
// report had landed when it had not.
//
// The reference is returned so it can be quoted, and it is the one actually stored.
import { randomUUID } from 'node:crypto'
import { AfronetAppReport } from '../../models/AfronetAppReport.model'

/** `AFN-RPT-7F2K91` — short enough to read out, random enough not to collide. */
function reference() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    let out = ''
    for (let i = 0; i < 6; i += 1) out += chars[Math.floor(Math.random() * chars.length)]
    return `AFN-RPT-${out}`
}

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const body = await readBody(event)
    const subject = String(body?.subject ?? '').trim().slice(0, 200)
    const reason = String(body?.reason ?? '').trim().slice(0, 120)

    if (!subject) throw createError({ statusCode: 400, message: 'There is nothing to report' })
    if (!reason) throw createError({ statusCode: 400, message: 'Choose a reason for the report' })

    const doc = {
        _id: randomUUID(),
        userId: session.userId,
        subject,
        kind: String(body?.kind ?? 'app') === 'review' ? 'review' : 'app',
        reason,
        details: String(body?.details ?? '').trim().slice(0, 2000),
        reference: reference(),
        status: 'open',
    }

    await AfronetAppReport.create(doc)

    return { success: true, data: { reference: doc.reference } }
})
