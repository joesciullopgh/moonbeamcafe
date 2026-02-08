'use client'

import { useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

// Pages that should NOT trigger the force-password-change redirect
const EXEMPT_PATHS = ['/change-password', '/login', '/signup', '/forgot-password', '/reset-password', '/auth/callback']

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, requiresPasswordChange } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    async function getInitialSession() {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setUser(user)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profile)
      }

      setLoading(false)
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const user = session?.user ?? null
        setUser(user)

        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          setProfile(profile)
        } else {
          setProfile(null)
        }

        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, setUser, setProfile, setLoading])

  // Force password change redirect
  useEffect(() => {
    if (requiresPasswordChange() && !EXEMPT_PATHS.includes(pathname)) {
      router.push('/change-password')
    }
  }, [pathname, requiresPasswordChange, router])

  return <>{children}</>
}
