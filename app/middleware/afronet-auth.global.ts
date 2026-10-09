// middleware/afronet-auth.global.ts
import { useAfronetUserStore } from '~/stores/afronetUser'

export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useAfronetUserStore()

    // Load the profile once if we don't have it yet
    if (!userStore.user) {
        await userStore.fetchProfile()
    }

    // /welcome and its children (e.g. /welcome/verify/:token) are the sign-in area
    const isWelcome = to.path === '/welcome' || to.path.startsWith('/welcome/')

    // The public front door: the landing page, the intro stepper and the 404 page are open to
    // everyone, signed in or not. Without this a visitor would be bounced straight to /welcome
    // and could never read the landing page at all.
    // The catch-all page too, so a visitor gets the real 404 instead of being bounced to sign-in.
    const isNotFound = typeof to.name === 'string' && to.name.startsWith('slug')
    const isPublic = to.path === '/' || to.path === '/explore' || to.path.startsWith('/explore/') || to.path === '/chat-stats' || isNotFound

    // Not logged in -> only the public pages and the sign-in area
    if (!userStore.isAuthenticated) {
        return isWelcome || isPublic ? undefined : navigateTo('/welcome')
    }

    // Logged in but no verified African ID yet -> only the verification page is allowed
    // const isVerifyId = to.path === '/verify-id'
    // if (!userStore.user.isDciVerified) {
    //     return isVerifyId ? undefined : navigateTo('/verify-id')
    // }

    // Logged in and verified, but on the sign-in page -> the chat, which is where signing in
    // lands. Other app pages stay reachable by typing their address.
    // if (isWelcome || isVerifyId) {
    if (isWelcome) {
        return navigateTo('/chat', { external: true })
    }
})
