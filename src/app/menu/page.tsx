'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MENU_ITEMS, MENU_CATEGORIES, type MenuItemData } from '@/lib/menu-data'
import type { MenuItem } from '@/lib/types/database'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<string>(MENU_CATEGORIES[0])
  const [usingFallback, setUsingFallback] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function fetchMenu() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .order('category')
        .order('name')

      if (error || !data || data.length === 0) {
        // Use fallback static menu data
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
            <MenuCard key={item.name} item={item} />
          ))}
        </div>

        {displayItems.length === 0 && (
          <div className="text-center py-12 text-accent">
            No items available in this category.
          </div>
        )}
      </div>
    </div>
  )
}

function MenuCard({ item }: { item: MenuItem | MenuItemData }) {
  const isCustomizable = 'customizable' in item ? item.customizable : false

  return (
    <div className="bg-white rounded-xl border border-secondary-dark/20 p-5 hover:shadow-md transition-shadow">
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
        <div className="text-right flex-shrink-0">
          <span className="text-lg font-bold text-accent">${item.price.toFixed(2)}</span>
        </div>
      </div>
    </div>
  )
}
