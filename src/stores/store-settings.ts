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
  story_title: string
  story_body: string
}

const DEFAULTS: StoreSettings = {
  store_name: 'Moonbeam Cafe',
  address_line1: '4621 Liberty Avenue',
  address_line2: 'Pittsburgh, PA',
  phone: '(412) 251-1392',
  hours_weekday: 'Mon–Sat: 7am – 5pm',
  hours_weekend: 'Sunday: 9am – 3pm',
  instagram_url: 'https://instagram.com/moonbeamcafe',
  facebook_url: 'https://facebook.com/MoonbeamCafePgh',
  tagline: 'Your neighborhood coffee shop in Pittsburgh, serving handcrafted drinks and fresh food with a warm smile.',
  story_title: 'More Than\nJust Coffee',
  story_body: 'Moonbeam Cafe is where the neighborhood comes together. We believe that great coffee has the power to build community, spark conversation, and brighten your day.\n\nEvery drink is handcrafted using locally roasted beans, organic ingredients, and syrups we make in-house. From our signature lavender lattes to our fresh-baked pastries, everything is made with intention and care.\n\nWhether you\'re grabbing your morning espresso, meeting a friend, or settling in for an afternoon of work, there\'s always a seat and a warm welcome waiting for you.',
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
