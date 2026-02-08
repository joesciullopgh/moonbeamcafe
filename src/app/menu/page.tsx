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
        <div className="relative">
          <div className="flex overflow-x-auto gap-2.5 pb-4 mb-8 scrollbar-hide -mx-1 px-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                  activeCategory === category
                    ? 'bg-primary text-secondary shadow-md shadow-primary/20'
                    : 'bg-secondary text-primary hover:bg-secondary-dark'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-white to-transparent pointer-events-none" />
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

const POPULAR_ITEMS = new Set([
  'Moonbeam Signature Latte',
  'Caramel Macchiato',
  'Mocha',
  'Cold Brew',
  'Chai Latte',
  'Avocado Toast',
  'Butter Croissant',
])

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
  const imageUrl = isMenuItem ? (item as MenuItem).image_url : null
  const isPopular = POPULAR_ITEMS.has(item.name)

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
    <div className="group relative bg-white rounded-2xl border border-secondary-dark/15 overflow-hidden shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 flex flex-col">
      {/* Favorite — absolute overlay */}
      {isMenuItem && (
        <div className="absolute top-2.5 right-2.5 z-10">
          <FavoriteButton menuItemId={(item as MenuItem).id} />
        </div>
      )}

      {/* Content area */}
      <div className="relative bg-gradient-to-br from-secondary/50 to-white px-6 pt-5 pb-4">
        {/* Popular badge */}
        {isPopular && (
          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2.5 py-1 rounded-full mb-3 uppercase tracking-wide">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Popular
          </span>
        )}

        {/* Drink photo or icon */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-14 h-14 rounded-xl object-cover ring-2 ring-white/60 shadow-sm mb-3"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-secondary/80 flex items-center justify-center mb-3 ring-1 ring-secondary-dark/10">
            <span className="text-2xl" role="img" aria-label={item.category}>{categoryIcon}</span>
          </div>
        )}

        {/* Name — primary scan target */}
        <h3 className="font-bold text-primary text-xl leading-tight pr-8">{item.name}</h3>

        {/* Price — below name for clear hierarchy */}
        <p className="text-lg font-black text-primary/80 mt-1">${item.price.toFixed(2)}</p>

        {/* Description — softened for supporting role */}
        <p className="text-accent text-xs mt-2 leading-relaxed line-clamp-2">{item.description}</p>

        {/* Customizable options hint */}
        {isCustomizable && (
          <p className="text-[11px] text-accent/60 font-medium uppercase tracking-wide mt-2.5">
            Hot · Iced · Blended
          </p>
        )}
      </div>

      {/* CTA — split between customize (primary) and quick-add (ghost) */}
      <div className="px-6 pb-5 pt-3 mt-auto">
        {isMenuItem ? (
          <button
            onClick={handleAddToCart}
            className={`w-full py-3 rounded-full font-bold text-sm transition-all active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary flex items-center justify-center gap-2 ${
              isCustomizable
                ? 'bg-primary text-secondary hover:bg-primary-light shadow-md shadow-primary/15'
                : 'bg-primary/10 text-primary hover:bg-primary hover:text-secondary border border-primary/20 hover:border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            {isCustomizable ? 'Customize & Add' : 'Quick Add'}
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
