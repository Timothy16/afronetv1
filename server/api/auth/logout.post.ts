// server/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
    const session = await afronetSession(event)
    await session.clear()
    return { success: true }
})
