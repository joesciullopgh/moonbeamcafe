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
  const [search, setSearch] = useState('')
  const cartItemCount = useCartStore(s => s.getItemCount())
  const cartTotal = useCartStore(s => s.getTotal())
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    let done = false

    async function fetchMenu() {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('is_available', true)
          .order('category')
          .order('name')

        if (done) return
        if (error || !data || data.length === 0) {
          setUsingFallback(true)
        } else {
          setMenuItems(data)
        }
      } catch {
        if (!done) setUsingFallback(true)
      } finally {
        done = true
        setLoading(false)
      }
    }

    fetchMenu()

    // Safety net: if Supabase hangs (cold start / network), fall back after 6s
    const timer = setTimeout(() => {
      if (!done) {
        done = true
        setUsingFallback(true)
        setLoading(false)
      }
    }, 6000)

    return () => { done = true; clearTimeout(timer) }
  }, [supabase])

  const q = search.toLowerCase().trim()
  const isSearching = q.length > 0

  const displayItems: (MenuItem | MenuItemData)[] = useMemo(() => {
    const source = usingFallback ? MENU_ITEMS : menuItems
    if (isSearching) {
      return source.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      )
    }
    return source.filter(item => item.category === activeCategory)
  }, [usingFallback, menuItems, isSearching, q, activeCategory])

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
        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-accent/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search the menu..."
            className="w-full pl-12 pr-10 py-3 bg-white border border-secondary-dark/20 rounded-full text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-accent/40 hover:text-accent"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Category Tabs — hidden while searching */}
        {!isSearching && <div className="relative">
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
        </div>}

        {/* Search result count */}
        {isSearching && (
          <p className="text-sm text-accent mb-4">
            {displayItems.length} result{displayItems.length !== 1 ? 's' : ''} for &ldquo;{search}&rdquo;
          </p>
        )}

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
            {isSearching
              ? `No items matching "${search}"`
              : 'No items available in this category.'}
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
  const imageUrl = isMenuItem ? (item as MenuItem).image_url : null
  const isPopular = isMenuItem ? (item as MenuItem).is_popular : false

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

      {/* Horizontal layout: photo left, text right */}
      <div className="relative bg-gradient-to-br from-secondary/40 to-white p-4 flex gap-4">
        {/* Photo — left, large */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name}
            className="w-24 h-24 rounded-2xl object-cover shadow-sm shrink-0"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-secondary flex items-center justify-center shrink-0">
            <span className="text-4xl" role="img" aria-label={item.category}>{categoryIcon}</span>
          </div>
        )}

        {/* Text — right */}
        <div className="flex-1 min-w-0 py-0.5">
          {isPopular && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1.5 uppercase tracking-wide">
              <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Popular
            </span>
          )}

          <h3 className="font-bold text-primary text-lg leading-snug pr-7">{item.name}</h3>
          <p className="text-base font-black text-primary/80 mt-0.5">${item.price.toFixed(2)}</p>
          <p className="text-accent text-xs mt-1.5 leading-relaxed line-clamp-2">{item.description}</p>

          {isCustomizable && (
            <p className="text-[11px] text-accent/50 font-medium uppercase tracking-wide mt-1.5">
              Hot · Iced · Blended
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 pb-4 pt-2 mt-auto">
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
