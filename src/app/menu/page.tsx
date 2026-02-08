'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
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
        <div className="flex overflow-x-auto gap-2.5 pb-4 mb-8 scrollbar-hide -mx-1 px-1">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all ${
                activeCategory === category
                  ? 'bg-primary text-secondary shadow-md shadow-primary/20'
                  : 'bg-secondary text-primary hover:bg-secondary-dark'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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

// Drink icon/emoji for visual variety
const CATEGORY_ICONS: Record<string, string> = {
  'Espresso Drinks': '☕',
  'Brewed Coffee': '🫖',
  'Cold Drinks': '🧊',
  'Tea': '🍵',
  'Specialty': '✨',
  'Seasonal': '🍂',
  'Pastries': '🥐',
  'Food': '🥪',
  'Smoothies': '🥤',
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
  const categoryIcon = CATEGORY_ICONS[item.category] || '☕'

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
    <div className="group relative bg-white rounded-2xl border border-gray-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      {/* Glass-style top accent */}
      <div className="relative bg-gradient-to-br from-primary/[0.06] to-secondary/40 px-5 pt-5 pb-4">
        <div className="flex items-start justify-between">
          <span className="text-3xl">{categoryIcon}</span>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-black text-primary">${item.price.toFixed(2)}</span>
            {isMenuItem && <FavoriteButton menuItemId={(item as MenuItem).id} />}
          </div>
        </div>
        <h3 className="font-bold text-primary text-lg mt-3 leading-tight">{item.name}</h3>
        <p className="text-accent/80 text-sm mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>
      </div>

      {/* Bottom action area */}
      <div className="px-5 pb-5 pt-3 mt-auto">
        {isMenuItem ? (
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-secondary py-3.5 rounded-xl font-bold text-base hover:bg-primary-light active:scale-[0.97] transition-all shadow-md shadow-primary/15 flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {isCustomizable ? 'Order & Customize' : 'Add to Order'}
          </button>
        ) : (
          <div className="text-center text-sm text-accent/60 py-2">
            Sign in to order
          </div>
        )}
      </div>
    </div>
  )
}
