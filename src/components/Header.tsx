'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { user, profile, loading } = useAuthStore()
  const cartItemCount = useCartStore(s => s.getItemCount())
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    setMobileMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'

  return (
    <header className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="Moonbeam Cafe"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span className="text-secondary font-semibold text-xl hidden sm:block">
              Moonbeam Cafe
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-secondary hover:text-white transition-colors text-sm font-medium">
              Home
            </Link>
            <Link href="/menu" className="text-secondary hover:text-white transition-colors text-sm font-medium">
              Menu
            </Link>
            {user && (
              <>
                <Link href="/orders" className="text-secondary hover:text-white transition-colors text-sm font-medium">
                  Orders
                </Link>
                <Link href="/favorites" className="text-secondary hover:text-white transition-colors text-sm font-medium">
                  Favorites
                </Link>
                <Link href="/rewards" className="text-secondary hover:text-white transition-colors text-sm font-medium">
                  Rewards
                </Link>
              </>
            )}
            {isStaff && (
              <Link href="/admin" className="text-secondary hover:text-white transition-colors text-sm font-medium">
                Admin
              </Link>
            )}
            {!loading && (
              <>
                {user ? (
                  <div className="flex items-center gap-4">
                    <Link href="/profile" className="text-secondary hover:text-white transition-colors text-sm font-medium">
                      {profile?.first_name || 'Profile'}
                    </Link>
                    {profile && (
                      <span className="text-secondary/70 text-xs">
                        {profile.stars} stars
                      </span>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="text-secondary/70 hover:text-white transition-colors text-sm"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link href="/login" className="text-secondary hover:text-white transition-colors text-sm font-medium">
                    Sign In
                  </Link>
                )}
              </>
            )}
            <Link
              href={cartItemCount > 0 ? '/cart' : '/menu'}
              className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-secondary-dark transition-colors relative"
            >
              {cartItemCount > 0 ? (
                <>
                  Cart ({cartItemCount})
                </>
              ) : (
                'Order Now'
              )}
            </Link>
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-secondary p-2"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 space-y-2">
            <Link href="/" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Home
            </Link>
            <Link href="/menu" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Menu
            </Link>
            {user && (
              <>
                <Link href="/orders" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Orders
                </Link>
                <Link href="/favorites" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Favorites
                </Link>
                <Link href="/rewards" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Rewards
                </Link>
              </>
            )}
            {isStaff && (
              <Link href="/admin" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                Admin
              </Link>
            )}
            {!loading && (
              <>
                {user ? (
                  <>
                    <Link href="/profile" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                      Profile {profile ? `(${profile.stars} stars)` : ''}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="block text-secondary/70 hover:text-white transition-colors py-2 text-sm"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="block text-secondary hover:text-white transition-colors py-2 text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                )}
              </>
            )}
            <Link
              href="/menu"
              className="inline-block bg-secondary text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-secondary-dark transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              Order Now
            </Link>
          </nav>
        )}
      </div>
    </header>
  )
}
