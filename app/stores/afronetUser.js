// stores/afronetUser.js
import { defineStore } from 'pinia'
import { clearOfflineUser, readOfflineUser, saveOfflineUser } from '~/lib/offlineUser'

export const useAfronetUserStore = defineStore('afronetUser', {
    state: () => ({
        user: null,
        loading: false,
        error: null,
        /** Signed in from the device's own record because the server couldn't be reached. */
        offline: false,
    }),

    getters: {
        isAuthenticated: (state) => !!state.user,
        fullName: (state) => {
            if (!state.user) return ''
            return `${state.user.firstName || ''} ${state.user.lastName || ''}`.trim()
        },
    },

    actions: {
        async fetchProfile() {
            this.loading = true
            this.error = null
            try {
                // useRequestFetch forwards the incoming request's cookies during SSR
                // (plain $fetch doesn't), so this resolves the same on server and client.
                const requestFetch = useRequestFetch()
                const res = await requestFetch('/api/auth/me')
                if (res.success) {
                    this.user = res.data
                    this.offline = false
                    // Remember who this is, so the installed app can open without a connection.
                    if (import.meta.client) saveOfflineUser(res.data)
                    return true
                }
                throw new Error('Profile fetch failed')
            } catch (error) {
                const status = error.statusCode || error.response?.status || error.data?.statusCode

                // No status means the request never reached the server (offline, or the app was
                // opened from the device's cache). If this device knows who was signed in, carry
                // on with that and check again once there is a connection. A real 401 is different:
                // the session has ended, and that clears the profile as before.
                if (import.meta.client && !status) {
                    const saved = readOfflineUser()
                    if (saved) {
                        this.user = saved
                        this.offline = true
                        this.error = null
                        return true
                    }
                }

                this.error = error.data?.message || error.message
                this.clearProfile()
                return false
            } finally {
                this.loading = false
            }
        },

        async login(credentials) {
            this.loading = true
            this.error = null
            try {
                const response = await $fetch('/api/auth/login', {
                    method: 'POST',
                    body: credentials,
                })
                if (response.success) {
                    this.user = response.data
                    return { success: true, data: response.data }
                }
                throw new Error('Login failed')
            } catch (error) {
                this.error = error.data?.message || error.message
                return { success: false, error: this.error }
            } finally {
                this.loading = false
            }
        },

        async register(payload) {
            this.loading = true
            this.error = null
            try {
                const response = await $fetch('/api/auth/register', {
                    method: 'POST',
                    body: payload,
                })
                if (response.success) {
                    this.user = response.data
                    return { success: true, data: response.data }
                }
                throw new Error('Registration failed')
            } catch (error) {
                this.error = error.data?.message || error.message
                return { success: false, error: this.error }
            } finally {
                this.loading = false
            }
        },

        // Sign-up step 1: email a verification link
        async sendVerification(email) {
            this.loading = true
            this.error = null
            try {
                const response = await $fetch('/api/auth/send-verification', {
                    method: 'POST',
                    body: { email },
                })
                return { success: true, message: response.message }
            } catch (error) {
                this.error = error.data?.message || error.message
                return { success: false, error: this.error }
            } finally {
                this.loading = false
            }
        },

        // Called from the emailed link; stores the verified email in the session
        async verifyEmail(token) {
            this.loading = true
            this.error = null
            try {
                const response = await $fetch('/api/auth/verify-email', {
                    method: 'POST',
                    body: { token },
                })
                return { success: true, email: response.data.email }
            } catch (error) {
                this.error = error.data?.message || error.message
                return { success: false, error: this.error }
            } finally {
                this.loading = false
            }
        },

        // The email this browser verified (null if none). Forwards cookies during SSR.
        async fetchVerifiedEmail() {
            try {
                const requestFetch = useRequestFetch()
                const response = await requestFetch('/api/auth/verified-email')
                return response.data.email
            } catch {
                return null
            }
        },

        async logout() {
            try {
                await $fetch('/api/auth/logout', { method: 'POST' })
                clearOfflineUser()
                this.clearProfile()
                return true
            } catch (error) {
                console.error('Logout error:', error)
                return false
            }
        },

        clearProfile() {
            this.user = null
            this.error = null
            this.loading = false
            this.offline = false
        },
    },
})
