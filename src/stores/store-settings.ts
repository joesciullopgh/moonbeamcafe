import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'

export interface StoreSettings {
  store_name: string
  address_line1: string
  address_line2: string
  phone: string
  hours_weekday: string
  hours_weekend: string
  instagram_url: string
  facebook_url: string
  tagline: string
}

const DEFAULTS: StoreSettings = {
  store_name: 'Moonbeam Cafe',
  address_line1: '4621 Liberty Avenue',
  address_line2: 'Pittsburgh, PA',
  phone: '(412) 251-1392',
  hours_weekday: 'Mon–Sat: 7am – 5pm',
  hours_weekend: 'Sunday: 9am – 3pm',
  instagram_url: 'https://instagram.com/moonbeamcafepgh',
  facebook_url: 'https://facebook.com/MoonbeamCafePgh',
  tagline: 'Your neighborhood coffee shop in Pittsburgh, serving handcrafted drinks and fresh food with a warm smile.',
}

interface StoreSettingsState {
  settings: StoreSettings
  loaded: boolean
  fetchSettings: () => Promise<void>
}

export const useStoreSettings = create<StoreSettingsState>((set) => ({
  settings: DEFAULTS,
  loaded: false,
  fetchSettings: async () => {
    try {
      const supabase = createClient()
      const { data } = await supabase
        .from('store_settings')
        .select('key, value')

      if (data && data.length > 0) {
        const fromDb: Partial<StoreSettings> = {}
        for (const row of data) {
          if (row.key in DEFAULTS) {
            (fromDb as Record<string, string>)[row.key] = row.value
          }
        }
        set({ settings: { ...DEFAULTS, ...fromDb }, loaded: true })
      } else {
        set({ loaded: true })
      }
    } catch {
      set({ loaded: true })
    }
  },
}))
