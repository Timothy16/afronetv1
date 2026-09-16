// app/composables/useAfronet.js
//
// Shared state for the whole shell: connection mode, notifications, pinned
// apps, open workspace windows, split view and background sync. Built on
// Nuxt's useState, so every component that calls useAfronet() reads and writes
// the same values, and nothing extra needs installing.
//
// The design also carried a light/dark theme here. Afronet ships light only,
// so the theme state and the `dark` class toggle are gone.

import { defaultPinned } from '~/data/apps'
import { notifications as seedNotifications } from '~/data/network'

export function useAfronet() {
  // Seed values are copied, never shared by reference, so mutating state can
  // never reach back into the module-level mock data.
  const mode = useState('afronet:mode', () => 'afronet')
  const notifications = useState('afronet:notifications', () => seedNotifications.map((n) => ({ ...n })))
  const pinned = useState('afronet:pinned', () => [...defaultPinned])
  const windows = useState('afronet:windows', () => [])
  const activeWindow = useState('afronet:active-window', () => null)
  const splitView = useState('afronet:split-view', () => false)
  const syncing = useState('afronet:syncing', () => false)

  const unread = computed(() => notifications.value.filter((n) => n.unread).length)

  const setMode = (value) => {
    mode.value = value
  }

  const markAllRead = () => {
    notifications.value = notifications.value.map((n) => ({ ...n, unread: false }))
  }

  const dismiss = (id) => {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  const togglePin = (id) => {
    pinned.value = pinned.value.includes(id) ? pinned.value.filter((x) => x !== id) : [...pinned.value, id]
  }

  const openApp = (id) => {
    windows.value = windows.value.some((w) => w.appId === id)
      ? windows.value.map((w) => (w.appId === id ? { ...w, minimized: false } : w))
      : [...windows.value, { appId: id, minimized: false }]
    activeWindow.value = id
  }

  const closeApp = (id) => {
    windows.value = windows.value.filter((w) => w.appId !== id)
    if (activeWindow.value === id) activeWindow.value = null
  }

  const minimizeApp = (id) => {
    windows.value = windows.value.map((w) => (w.appId === id ? { ...w, minimized: true } : w))
    if (activeWindow.value === id) activeWindow.value = null
  }

  const focusApp = (id) => {
    windows.value = windows.value.map((w) => (w.appId === id ? { ...w, minimized: false } : w))
    activeWindow.value = id
  }

  const setSplitView = (value) => {
    splitView.value = value
  }

  const startSync = () => {
    syncing.value = true
    window.setTimeout(() => {
      syncing.value = false
    }, 2600)
  }

  return {
    mode,
    setMode,
    notifications,
    unread,
    markAllRead,
    dismiss,
    pinned,
    togglePin,
    windows,
    activeWindow,
    openApp,
    closeApp,
    minimizeApp,
    focusApp,
    splitView,
    setSplitView,
    syncing,
    startSync,
  }
}
