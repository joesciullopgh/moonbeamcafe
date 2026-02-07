'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MENU_ITEMS, MENU_CATEGORIES, type MenuItemData } from '@/lib/menu-data'
import type { MenuItem } from '@/lib/types/database'
import { useCartStore, type CartCustomization } from '@/stores/cart-store'
import CustomizationModal from '@/components/CustomizationModal'
import FavoriteButton from '@/components/FavoriteButton'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0])
  const [usingFallback, setUsingFallback] = useState(false)
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null)
  const cartItemCount = useCartStore(s => s.getItemCount())
  const cartTotal = useCartStore(s => s.getTotal())
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchMenu() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('name')

      if (error || !data || data.length === 0) {
        setUsingFallback(true)
      } else {
        setMenuItems(data)
      }
      setLoading(false)
    }

    fetchMenu()
  }, [supabase])

  const displayItems: (MenuItem | MenuItemData)[] = usingFallback
    ? MENU_ITEMS.filter(item => item.category === activeCategory)
    : menuItems.filter(item => item.category === activeCategory)

  const categories = usingFallback
    ? MENU_CATEGORIES
    : [...new Set(menuItems.map(item => item.category))]

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading menu...</div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh]">
      {/* Header */}
      <div className="bg-primary py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-secondary">Our Menu</h1>
          <p className="text-secondary/70 mt-2">Handcrafted with care, served with a smile</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Tabs */}
        <div className="flex overflow-x-auto gap-2 pb-4 mb-8 scrollbar-hide">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-primary text-secondary'
                  : 'bg-secondary text-primary hover:bg-secondary-dark'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((item) => (
            <MenuCard
              key={item.name}
              item={item}
              onCustomize={usingFallback ? undefined : (menuItem) => setCustomizingItem(menuItem)}
              usingFallback={usingFallback}
            />
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="text-center py-12 text-accent">
            No items available in this category.
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Link
            href="/cart"
            className="flex items-center gap-3 bg-primary text-secondary px-6 py-3 rounded-full shadow-lg hover:bg-primary-light transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
            <span className="font-semibold">{cartItemCount} items</span>
            <span className="font-bold">${cartTotal.toFixed(2)}</span>
          </Link>
        </div>
      )}

      {/* Customization Modal */}
      {customizingItem && (
        <CustomizationModal
          item={customizingItem}
          onClose={() => setCustomizingItem(null)}
        />
      )}
    </div>
  )
}

function MenuCard({
  item,
  onCustomize,
  usingFallback,
}: {
  item: MenuItem | MenuItemData
  onCustomize?: (item: MenuItem) => void
  usingFallback: boolean
}) {
  const addItem = useCartStore(s => s.addItem)
  const isCustomizable = 'customizable' in item ? item.customizable : false
  const isMenuItem = !usingFallback && 'id' in item
  const imageUrl = 'image_url' in item ? item.image_url : null

  function handleAddToCart() {
    if (!isMenuItem) return
    const menuItem = item as MenuItem

    if (isCustomizable && onCustomize) {
      onCustomize(menuItem)
    } else {
      const defaultCustomizations: CartCustomization[] = []
      addItem(menuItem, defaultCustomizations, '')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-dark/20 overflow-hidden hover:shadow-md transition-shadow">
      {/* Product Image */}
      {imageUrl ? (
        <div className="relative w-full h-48">
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      ) : (
        <div className="w-full h-32 bg-gradient-to-br from-secondary to-secondary-dark/30 flex items-center justify-center">
          <svg className="w-10 h-10 text-accent/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Card Content */}
      <div className="p-5">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1">
            <h3 className="font-semibold text-primary text-lg">{item.name}</h3>
            <p className="text-accent text-sm mt-1">{item.description}</p>
            {isCustomizable && (
              <span className="inline-block mt-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                Customizable
              </span>
            )}
          </div>
          <div className="text-right flex-shrink-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-1">
              <span className="text-lg font-bold text-accent">${item.price.toFixed(2)}</span>
              {isMenuItem && <FavoriteButton menuItemId={(item as MenuItem).id} />}
            </div>
            {isMenuItem && (
              <button
                onClick={handleAddToCart}
                className="bg-primary text-secondary px-3 py-1.5 rounded-full text-xs font-medium hover:bg-primary-light transition-colors"
              >
                {isCustomizable ? 'Customize' : 'Add'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
