// app/composables/useStoreUser.js
//
// Who the store and Studio are talking to.
//
// There was a mock person here — "Amara Okafor" — which meant Studio greeted every developer
// by somebody else's name, and a review written on this device was signed by a stranger. The
// real one is in the session the rest of the app already uses.
//
// It falls back rather than failing: a screen that cannot name you should still render.

export function useStoreUser() {
  const store = useAfronetUserStore()

  const user = computed(() => store.user ?? null)

  const name = computed(() => {
    const full = [user.value?.firstName, user.value?.lastName].filter(Boolean).join(' ').trim()
    return full || user.value?.username || 'You'
  })

  const handle = computed(() => user.value?.username ?? '')

  const school = computed(() => user.value?.school ?? '')

  /** "Amara O." — how a review is signed, so a full name is never published. */
  const initialled = computed(() => {
    const parts = name.value.split(/\s+/).filter(Boolean)
    if (parts.length < 2) return parts[0] ?? 'You'
    return `${parts[0]} ${parts[1][0]}.`
  })

  return { user, name, handle, school, initialled }
}
