import { registerSW } from 'virtual:pwa-register'

let updateSW: ((reloadPage?: boolean) => Promise<void>) | undefined

export function registerServiceWorker(): void {
  updateSW = registerSW({
    onNeedRefresh() {
      // Dispatch event so UI can show update prompt
      window.dispatchEvent(new CustomEvent('kanji-sw-update'))
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent('kanji-offline-ready'))
    },
  })
}

/** Call this to apply the pending service worker update */
export function applyUpdate(): void {
  updateSW?.(true)
}
