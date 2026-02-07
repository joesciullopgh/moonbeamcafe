'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

const adminLinks = [
  { href: '/admin', label: 'Dashboard' },
  { href: '/admin/menu', label: 'Menu' },
  { href: '/admin/orders', label: 'Orders' },
  { href: '/admin/users', label: 'Users' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, loading } = useAuthStore()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!loading && (!profile || (profile.role !== 'admin' && profile.role !== 'staff'))) {
      router.push('/')
    }
  }, [profile, loading, router])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading...</div>
      </div>
    )
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'staff')) {
    return null
  }

  return (
    <div className="min-h-[80vh]">
      <div className="bg-primary/5 border-b border-secondary-dark/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3">
            {adminLinks.map((link) => {
              // Only show Users link to admins
              if (link.href === '/admin/users' && profile.role !== 'admin') return null
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-secondary'
                      : 'text-primary hover:bg-primary/10'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  )
}
