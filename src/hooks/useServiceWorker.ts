import { useState, useEffect, useCallback } from 'react'
import { applyUpdate } from '@/pwa'

export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)

  useEffect(() => {
    function handleUpdate() {
      setNeedRefresh(true)
    }

    function handleOfflineReady() {
      setOfflineReady(true)
    }

    window.addEventListener('kanji-sw-update', handleUpdate)
    window.addEventListener('kanji-offline-ready', handleOfflineReady)
    return () => {
      window.removeEventListener('kanji-sw-update', handleUpdate)
      window.removeEventListener('kanji-offline-ready', handleOfflineReady)
    }
  }, [])

  const updateApp = useCallback(() => {
    applyUpdate()
  }, [])

  const dismissOfflineReady = useCallback(() => {
    setOfflineReady(false)
  }, [])

  return { needRefresh, offlineReady, updateApp, dismissOfflineReady }
}
