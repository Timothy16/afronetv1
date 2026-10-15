// server/utils/appRatings.ts
//
// An app's star rating, worked out from its reviews.
//
// Recomputed from the rows rather than adjusted up and down as they arrive. An average kept
// by addition drifts: a missed decrement, a failed write, an edit counted twice, and the
// number on the listing slowly stops matching the reviews underneath it. Counting is cheap
// and there is only ever one answer.
//
// Bug reports and feature requests are left out. Someone reporting a crash has not given the
// app one star, and treating it as though they had is how a rating stops meaning anything.

import { AfronetApp } from '../models/AfronetApp.model'
import { AfronetAppReview } from '../models/AfronetAppReview.model'

export async function recountRating(appId: string) {
    const rows = await AfronetAppReview
        .find({ appId, kind: 'review' })
        .select('rating')
        .lean<any[]>()

    const ratingCount = rows.length
    const rating = ratingCount
        ? Math.round((rows.reduce((sum, r) => sum + (r.rating ?? 0), 0) / ratingCount) * 10) / 10
        : 0

    await AfronetApp.findByIdAndUpdate(appId, { $set: { rating, ratingCount } })

    return { rating, ratingCount }
}
