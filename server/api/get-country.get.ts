// server/api/get-country.get.ts
export default defineEventHandler(async () => {
    const config = useRuntimeConfig()

    if (!config.baseUrl) {
        throw createError({ statusCode: 500, message: 'Base URL not configured' })
    }

    try {
        return await $fetch(`${config.baseUrl}/api/v1/all-countries`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept-Language': 'en-US',
            },
        })
    } catch (error: any) {
        throw createError({
            statusCode: error?.statusCode || error?.status || 502,
            message: error?.data?.message || 'Could not load countries',
        })
    }
})
