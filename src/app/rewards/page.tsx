'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'
import { useEffect } from 'react'

const REWARDS_TIERS = [
  { stars: 25, reward: 'Free pastry of your choice' },
  { stars: 50, reward: 'Free any size drip coffee or tea' },
  { stars: 100, reward: 'Free specialty drink (any size)' },
  { stars: 150, reward: 'Free breakfast item' },
  { stars: 200, reward: 'Free lunch item' },
  { stars: 300, reward: 'Free drink + food combo' },
]

export default function RewardsPage() {
  const { user, profile, loading } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading || !profile) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">Moonbeam Rewards</h1>

      {/* Stars Balance */}
      <div className="bg-primary rounded-2xl p-8 mb-8 text-center">
        <p className="text-secondary/70 text-sm mb-2">Your Stars Balance</p>
        <p className="text-5xl font-bold text-secondary mb-2">{profile.stars}</p>
        <div className="flex items-center justify-center gap-1">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`w-5 h-5 ${i < Math.min(5, Math.floor(profile.stars / 10)) ? 'text-yellow-400' : 'text-secondary/30'}`}
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          ))}
        </div>
        <p className="text-secondary/60 text-sm mt-3">
          Earn 1 star for every $1 spent
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary font-bold">1</span>
            </div>
            <p className="text-sm text-text-dark font-medium">Order</p>
            <p className="text-xs text-accent">Place an order through the app</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary font-bold">2</span>
            </div>
            <p className="text-sm text-text-dark font-medium">Earn</p>
            <p className="text-xs text-accent">Get 1 star per $1 spent</p>
          </div>
          <div className="text-center">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-primary font-bold">3</span>
            </div>
            <p className="text-sm text-text-dark font-medium">Redeem</p>
            <p className="text-xs text-accent">Use stars for free items</p>
          </div>
        </div>
      </div>

      {/* Rewards Tiers */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
        <h2 className="text-lg font-semibold text-primary mb-4">Rewards Tiers</h2>
        <div className="space-y-3">
          {REWARDS_TIERS.map(tier => {
            const isUnlocked = profile.stars >= tier.stars
            const progress = Math.min(100, (profile.stars / tier.stars) * 100)

            return (
              <div key={tier.stars} className={`p-4 rounded-lg border ${isUnlocked ? 'border-primary/30 bg-primary/5' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isUnlocked ? 'text-primary' : 'text-gray-400'}`}>
                      {tier.stars} stars
                    </span>
                    {isUnlocked && (
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-sm ${isUnlocked ? 'text-primary font-medium' : 'text-accent'}`}>
                    {tier.reward}
                  </span>
                </div>
                {!isUnlocked && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className="bg-primary rounded-full h-1.5 transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="text-center mt-8">
        <Link
          href="/menu"
          className="inline-block bg-primary text-secondary px-8 py-3 rounded-full font-semibold hover:bg-primary-light transition-colors"
        >
          Start Earning Stars
        </Link>
      </div>
    </div>
  )
}
