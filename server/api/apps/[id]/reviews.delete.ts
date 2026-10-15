// server/api/apps/[id]/reviews.delete.ts
//
// Taking back what you said.
//
// Only your own, and the key makes that true rather than a check that could be forgotten:
// there is no row anyone else could name. The rating is recounted afterwards, so removing a
// one-star review moves the average the way removing it should.
import { AfronetAppReview } from '../../../models/AfronetAppReview.model'
import { recountRating } from '../../../utils/appRatings'

export default defineEventHandler(async (event) => {
    const session = await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')

    await AfronetAppReview.deleteOne({ _id: `${session.userId}:${id}` })
    const totals = await recountRating(String(id))

    return { success: true, data: totals }
})
