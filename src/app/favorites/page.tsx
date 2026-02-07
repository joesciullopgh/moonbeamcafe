'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Favorite } from '@/lib/types/database'

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Favorite[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuthStore()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    async function fetchFavorites() {
      const { data } = await supabase
        .from('favorites')
        .select('*, menu_item:menu_items(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      setFavorites(data || [])
      setLoading(false)
    }
    fetchFavorites()
  }, [user, authLoading, router, supabase])

  async function removeFavorite(favoriteId: string) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('id', favoriteId)

    if (!error) {
      setFavorites(prev => prev.filter(f => f.id !== favoriteId))
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading favorites...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-accent/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <p className="text-accent mb-6">You haven&apos;t added any favorites yet.</p>
          <Link
            href="/menu"
            className="inline-block bg-primary text-secondary px-6 py-3 rounded-full font-semibold hover:bg-primary-light transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {favorites.map(fav => (
            <div key={fav.id} className="bg-white rounded-xl border border-secondary-dark/20 p-5">
              {fav.menu_item && (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-primary">{fav.menu_item.name}</h3>
                      <p className="text-accent text-sm mt-1">{fav.menu_item.description}</p>
                    </div>
                    <span className="font-bold text-accent">${fav.menu_item.price.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-accent/50">
                      Added {new Date(fav.created_at).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => removeFavorite(fav.id)}
                      className="text-red-500 hover:text-red-600 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
