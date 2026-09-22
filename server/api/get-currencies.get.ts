// server/api/get-currencies.get.ts
const config = useRuntimeConfig()
export default defineEventHandler(async (event) => {
    try {
        const currencies = await $fetch(`${config.baseUrl}/api/v1/all-currencies`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Accept-Language": "en-US",

                },

            }).catch((error) => {
                throw createError({
                    message: error.data.message,
                    data: null,
                    status: error.status,
                });
            })
        return currencies
    }
    catch (error) {
        throw createError({
            message: "Invalid Url",
            status: 404,
            statusCode: 404,
            stack: undefined,
            data: null,

        });
    }
})
