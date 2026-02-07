'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useCartStore } from '@/stores/cart-store'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [accountMenuOpen, setAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef<HTMLDivElement>(null)
  const { user, profile, loading } = useAuthStore()
  const cartItemCount = useCartStore(s => s.getItemCount())
  const router = useRouter()
  const supabase = createClient()

  const isStaff = profile?.role === 'staff' || profile?.role === 'admin'
  const displayName = profile?.first_name || 'there'

  // Close account dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleSignOut() {
    setAccountMenuOpen(false)
    setMobileMenuOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="bg-primary sticky top-0 z-50 shadow-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Top bar: greeting */}
        {!loading && (
          <div className="flex items-center justify-between pt-2 pb-1 text-xs text-secondary/60">
            <span>
              {user && profile
                ? `${getGreeting()}, ${displayName}`
                : `${getGreeting()}, welcome to Moonbeam`}
            </span>
            {user && profile && <span>{profile.stars} stars</span>}
          </div>
        )}

        <div className="flex h-14 items-center justify-between">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <Image
              src="/logo.svg"
              alt=""
              width={32}
              height={32}
              aria-hidden="true"
            />
            <span className="text-secondary font-semibold text-lg tracking-tight">
              Moonbeam Cafe
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-5">
            <Link href="/" className="text-secondary/80 hover:text-white transition-colors text-sm font-medium">
              Home
            </Link>
            <Link href="/menu" className="text-secondary/80 hover:text-white transition-colors text-sm font-medium">
              Menu
            </Link>
            {user && (
              <>
                <Link href="/orders" className="text-secondary/80 hover:text-white transition-colors text-sm font-medium">
                  Orders
                </Link>
                <Link href="/rewards" className="text-secondary/80 hover:text-white transition-colors text-sm font-medium">
                  Rewards
                </Link>
              </>
            )}
            {isStaff && (
              <Link href="/admin" className="text-secondary/80 hover:text-white transition-colors text-sm font-medium">
                Admin
              </Link>
            )}

            {/* Cart */}
            <Link
              href={cartItemCount > 0 ? '/cart' : '/menu'}
              className="relative text-secondary/80 hover:text-white transition-colors"
              aria-label={cartItemCount > 0 ? `Cart with ${cartItemCount} items` : 'Order now'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-secondary text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* Account */}
            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={accountMenuRef}>
                    <button
                      onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                      className="flex items-center gap-1.5 bg-secondary/15 hover:bg-secondary/25 text-secondary rounded-full pl-1.5 pr-3 py-1.5 transition-colors"
                    >
                      <span className="w-6 h-6 bg-secondary text-primary rounded-full flex items-center justify-center text-xs font-bold">
                        {(profile?.first_name?.[0] || profile?.email?.[0] || 'U').toUpperCase()}
                      </span>
                      <svg className={`w-3.5 h-3.5 text-secondary/70 transition-transform ${accountMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown */}
                    {accountMenuOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-text-dark">
                            {profile?.first_name} {profile?.last_name}
                          </p>
                          <p className="text-xs text-accent truncate">{profile?.email}</p>
                        </div>
                        <Link
                          href="/profile"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-primary/5 transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          Edit Profile
                        </Link>
                        <Link
                          href="/favorites"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-primary/5 transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          Favorites
                        </Link>
                        <Link
                          href="/rewards"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-primary/5 transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                          </svg>
                          Rewards ({profile?.stars || 0} stars)
                        </Link>
                        <Link
                          href="/orders"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-dark hover:bg-primary/5 transition-colors"
                          onClick={() => setAccountMenuOpen(false)}
                        >
                          <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Order History
                        </Link>
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="bg-secondary text-primary px-4 py-2 rounded-full text-sm font-semibold hover:bg-secondary-dark transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </>
            )}
          </nav>

          {/* Mobile: cart + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            <Link
              href={cartItemCount > 0 ? '/cart' : '/menu'}
              className="relative text-secondary/80 hover:text-white transition-colors"
              aria-label={cartItemCount > 0 ? `Cart with ${cartItemCount} items` : 'Order now'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-secondary text-primary text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-secondary p-1"
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
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <nav className="md:hidden pb-4 border-t border-secondary/15 pt-3">
            {/* Greeting on mobile */}
            {!loading && user && profile && (
              <div className="pb-3 mb-3 border-b border-secondary/15">
                <p className="text-secondary text-sm font-medium">{getGreeting()}, {displayName}</p>
                <p className="text-secondary/50 text-xs">{profile.stars} stars</p>
              </div>
            )}

            <div className="space-y-1">
              <MobileNavLink href="/" label="Home" onClick={() => setMobileMenuOpen(false)} />
              <MobileNavLink href="/menu" label="Menu" onClick={() => setMobileMenuOpen(false)} />

              {user && (
                <>
                  <MobileNavLink href="/orders" label="Orders" onClick={() => setMobileMenuOpen(false)} />
                  <MobileNavLink href="/rewards" label="Rewards" onClick={() => setMobileMenuOpen(false)} />
                  <MobileNavLink href="/favorites" label="Favorites" onClick={() => setMobileMenuOpen(false)} />
                </>
              )}

              {isStaff && (
                <MobileNavLink href="/admin" label="Admin" onClick={() => setMobileMenuOpen(false)} />
              )}
            </div>

            {!loading && (
              <div className="mt-3 pt-3 border-t border-secondary/15">
                {user ? (
                  <div className="space-y-1">
                    <MobileNavLink href="/profile" label="Edit Profile" onClick={() => setMobileMenuOpen(false)} />
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left text-red-300 hover:text-red-200 transition-colors py-2 text-sm font-medium"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <Link
                    href="/login"
                    className="inline-block bg-secondary text-primary px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-secondary-dark transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}

function MobileNavLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      className="block text-secondary/80 hover:text-white transition-colors py-2 text-sm font-medium"
      onClick={onClick}
    >
      {label}
    </Link>
  )
}
