'use client'

import { useEffect } from 'react'
import { useStoreSettings } from '@/stores/store-settings'

export default function StoreSettingsLoader() {
  const { loaded, fetchSettings } = useStoreSettings()

  useEffect(() => {
    if (!loaded) {
      fetchSettings()
    }
  }, [loaded, fetchSettings])

  return null
}
