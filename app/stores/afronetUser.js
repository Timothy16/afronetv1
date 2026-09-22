// stores/afronetUser.js
import { defineStore } from 'pinia'

export const useAfronetUserStore = defineStore('afronetUser', {
    state: () => ({
        user: null,
        loading: false,
        error: null,
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
                    return true
                }
                throw new Error('Profile fetch failed')
            } catch (error) {
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
        },
    },
})
