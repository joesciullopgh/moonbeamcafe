import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { MenuItem } from '@/lib/types/database'

export interface CartCustomization {
  type: string
  name: string
  price_modifier: number
}

export interface CartItem {
  id: string // unique cart item id
  menu_item: MenuItem
  quantity: number
  customizations: CartCustomization[]
  special_instructions: string
  item_total: number
}

interface CartState {
  items: CartItem[]
  addItem: (menuItem: MenuItem, customizations: CartCustomization[], specialInstructions: string) => void
  removeItem: (cartItemId: string) => void
  updateQuantity: (cartItemId: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

function calculateItemTotal(basePrice: number, customizations: CartCustomization[], quantity: number): number {
  const customizationTotal = customizations.reduce((sum, c) => sum + c.price_modifier, 0)
  return (basePrice + customizationTotal) * quantity
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (menuItem, customizations, specialInstructions) => {
        const id = crypto.randomUUID()
        const item_total = calculateItemTotal(menuItem.price, customizations, 1)
        set((state) => ({
          items: [...state.items, {
            id,
            menu_item: menuItem,
            quantity: 1,
            customizations,
            special_instructions: specialInstructions,
            item_total,
          }],
        }))
      },
      removeItem: (cartItemId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== cartItemId),
        }))
      },
      updateQuantity: (cartItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(cartItemId)
          return
        }
        set((state) => ({
          items: state.items.map((item) =>
            item.id === cartItemId
              ? {
                  ...item,
                  quantity,
                  item_total: calculateItemTotal(item.menu_item.price, item.customizations, quantity),
                }
              : item
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => get().items.reduce((sum, item) => sum + item.item_total, 0),
      getItemCount: () => get().items.reduce((sum, item) => sum + item.quantity, 0),
    }),
    {
      name: 'moonbeam-cart',
    }
  )
)
