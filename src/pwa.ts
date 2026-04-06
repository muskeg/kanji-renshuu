export function registerServiceWorker(): void {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/kanji-renshuu/sw.js')
        .catch(() => {
          // Service worker registration failed — app works fine without it
        })
    })
  }
}
