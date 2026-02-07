import { create } from 'zustand'
import type { Profile } from '@/lib/types/database'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setLoading: (loading: boolean) => void
  isAdmin: () => boolean
  isStaff: () => boolean
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
}))
