// app/composables/useOnline.ts
const online = ref(true)
let listening = false

/** Reactive navigator.onLine, shared across components. */
export function useOnline() {
    if (import.meta.client && !listening) {
        listening = true
        const update = () => { online.value = navigator.onLine }
        update()
        window.addEventListener('online', update)
        window.addEventListener('offline', update)
    }
    return readonly(online)
}
