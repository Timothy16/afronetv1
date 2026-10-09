// app/lib/offlineUser.ts
//
// A small record of who was last signed in on this device, so the installed app can open with no
// connection instead of bouncing the user to the sign-in screen.
//
// It holds no credentials — only what the shell needs to show, plus the account id that the
// conversations on this device are filed under. Cleared on sign-out.

const KEY = 'afronet:offline-user'

export interface OfflineUser {
    _id: string
    firstName: string
    lastName: string
    username: string
    profileImage: string | null
    /** When the server last confirmed this. */
    verifiedAt: string
}

export function saveOfflineUser(user: any) {
    if (!user?._id) return
    const snapshot: OfflineUser = {
        _id: String(user._id),
        firstName: user.firstName ?? '',
        lastName: user.lastName ?? '',
        username: user.username ?? '',
        profileImage: user.profileImage ?? null,
        verifiedAt: new Date().toISOString(),
    }
    try { localStorage.setItem(KEY, JSON.stringify(snapshot)) }
    catch { /* storage unavailable: offline opening just won't work */ }
}

export function readOfflineUser(): OfflineUser | null {
    try {
        const raw = localStorage.getItem(KEY)
        const parsed = raw ? JSON.parse(raw) as OfflineUser : null
        return parsed?._id ? parsed : null
    }
    catch { return null }
}

export function clearOfflineUser() {
    try { localStorage.removeItem(KEY) }
    catch { /* nothing to clean up */ }
}
