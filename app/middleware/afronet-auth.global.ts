// middleware/afronet-auth.global.ts
import { useAfronetUserStore } from '~/stores/afronetUser'

export default defineNuxtRouteMiddleware(async (to) => {
    const userStore = useAfronetUserStore()

    // Load the profile once if we don't have it yet
    if (!userStore.user) {
        await userStore.fetchProfile()
    }

    // /welcome and its children (e.g. /welcome/verify/:token) are the guest area
    const isWelcome = to.path === '/welcome' || to.path.startsWith('/welcome/')

    // Not logged in -> only the guest area is allowed
    if (!userStore.isAuthenticated) {
        return isWelcome ? undefined : navigateTo('/welcome')
    }

    // Logged in but on the guest page -> send home
    if (isWelcome) {
        return navigateTo('/')
    }
})
