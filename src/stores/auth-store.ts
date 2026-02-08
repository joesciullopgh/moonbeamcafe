import { create } from 'zustand'
import type { Profile } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

const PASSWORD_MAX_AGE_DAYS = 90

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  isAdmin: () => boolean
  isStaff: () => boolean
  requiresPasswordChange: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
  isAdmin: () => get().profile?.role === 'admin',
  isStaff: () => {
    const role = get().profile?.role
    return role === 'staff' || role === 'admin'
  },
  requiresPasswordChange: () => {
    const profile = get().profile
    if (!profile) return false

    // Admin-forced password reset
    if (profile.force_password_reset) return true

    // Password expiry (90 days)
    if (profile.password_changed_at) {
      const changedAt = new Date(profile.password_changed_at).getTime()
      const maxAge = PASSWORD_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
      if (Date.now() - changedAt > maxAge) return true
    }

    return false
  },
}))
