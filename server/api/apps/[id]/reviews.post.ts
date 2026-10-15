// server/api/apps/[id]/reviews.post.ts
//
// Writing a review, or changing the one you already wrote.
//
// Two rules, both enforced here rather than by the screen:
//
//   You have to have the app. A store where anyone can rate anything is a store where
//   ratings are worth nothing, and the account's library already says who has what.
//
//   One per account. Writing again edits what you said. The key is built from the pair, so
//   that holds even if two requests arrive together.
//
// There were three kinds once — a review, a bug report and a feature request — and they shared
// that one row, so filing a bug replaced the review someone had written and took their stars
// with it. The kind field stays on the row, always "review", so the handful already written
// keep working and nothing has to be migrated.
//
// The author is taken from the session, never from the request. A name sent by the browser is
// a name anyone can choose.
import { AfronetApp } from '../../../models/AfronetApp.model'
import { AfronetAppInstall } from '../../../models/AfronetAppInstall.model'
import { AfronetAppReview } from '../../../models/AfronetAppReview.model'
import { AfronetUser } from '../../../models/AfronetUser.model'
import { recountRating } from '../../../utils/appRatings'

/** "Ada O." — enough to be a person, not enough to be a full name on a public page. */
function signature(user: any) {
    const first = String(user?.firstName ?? '').trim()
    const last = String(user?.lastName ?? '').trim()
    if (first && last) return `${first} ${last[0]}.`
    return first || String(user?.username ?? '').trim() || 'Afronet user'
}

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const body = await readBody(event)

    const listing = await AfronetApp.findById(id).select('version').lean<any>()
    if (!listing) throw createError({ statusCode: 404, message: 'App not found' })

    const had = await AfronetAppInstall.exists({ _id: `${session.userId}:${id}` })
    if (!had) {
        throw createError({ statusCode: 403, message: 'Install an app before reviewing it' })
    }

    const rating = Math.round(Number(body?.rating) || 0)
    if (rating < 1 || rating > 5) {
        throw createError({ statusCode: 400, message: 'Choose a rating from one to five' })
    }

    const text = String(body?.body ?? '').trim().slice(0, 2000)

    const user = await AfronetUser.findById(session.userId).select('firstName lastName username').lean<any>()

    await AfronetAppReview.updateOne(
        { _id: `${session.userId}:${id}` },
        {
            $set: {
                appId: id,
                userId: session.userId,
                author: signature(user),
                rating,
                kind: 'review',
                body: text,
                version: listing.version ?? '',
            },
            $setOnInsert: { verified: false },
        },
        { upsert: true },
    )

    const totals = await recountRating(String(id))

    return { success: true, data: totals }
})
