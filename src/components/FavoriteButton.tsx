'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'

export default function FavoriteButton({ menuItemId }: { menuItemId: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    if (!user) return

    async function checkFavorite() {
      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user!.id)
        .eq('menu_item_id', menuItemId)
        .maybeSingle()

      setIsFavorite(!!data)
    }
    checkFavorite()
  }, [user, menuItemId, supabase])

  async function toggleFavorite() {
    if (!user || loading) return
    setLoading(true)

    if (isFavorite) {
      await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('menu_item_id', menuItemId)
      setIsFavorite(false)
    } else {
      await supabase
        .from('favorites')
        .insert({ user_id: user.id, menu_item_id: menuItemId })
      setIsFavorite(true)
    }

    setLoading(false)
  }

  if (!user) return null

  return (
    <button
      onClick={toggleFavorite}
      disabled={loading}
      className="p-3 -m-1 rounded-full transition-colors disabled:opacity-50 hover:bg-black/5 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg
        className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400 hover:text-red-400'}`}
        fill={isFavorite ? 'currentColor' : 'none'}
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    </button>
  )
}
