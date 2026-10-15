// server/api/apps/[id].get.ts
//
// One listing, by its address. Used when a link to an app is opened directly rather than
// reached from the store, so the page has what it needs without the whole catalogue.
import { AfronetApp } from '../../models/AfronetApp.model'

export default defineEventHandler(async (event) => {
    await requireAfronetUser(event)
    await ensureMongo()

    const id = getRouterParam(event, 'id')
    const app = await AfronetApp.findById(id).lean<any>()

    if (!app) throw createError({ statusCode: 404, message: 'App not found' })

    return { success: true, data: serializeAfronetApp(app) }
})
