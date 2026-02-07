'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore()
  const { user, profile, setProfile } = useAuthStore()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const total = getTotal()
  const starsToEarn = Math.floor(total)

  async function handlePlaceOrder() {
    if (!user) {
      router.push('/login')
      return
    }

    setPlacing(true)
    setError('')

    const orderItems = items.map(item => ({
      menu_item_id: item.menu_item.id,
      menu_item_name: item.menu_item.name,
      quantity: item.quantity,
      customizations: item.customizations,
      special_instructions: item.special_instructions,
      item_total: item.item_total,
    }))

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        items: orderItems,
        total,
        status: 'pending',
        stars_earned: starsToEarn,
      })
      .select()
      .single()

    if (orderError) {
      setError('Failed to place order: ' + orderError.message)
      setPlacing(false)
      return
    }

    // Award stars
    if (profile) {
      const newStars = profile.stars + starsToEarn
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .update({ stars: newStars })
        .eq('id', user.id)
        .select()
        .single()

      if (updatedProfile) {
        setProfile(updatedProfile)
      }
    }

    clearCart()
    router.push(`/orders/${order.id}`)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="text-center">
          <svg className="w-16 h-16 text-accent/30 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          <h2 className="text-xl font-semibold text-primary mb-2">Your cart is empty</h2>
          <p className="text-accent mb-6">Add some items from our menu to get started!</p>
          <Link
            href="/menu"
            className="inline-block bg-primary text-secondary px-6 py-3 rounded-full font-semibold hover:bg-primary-light transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">Your Cart</h1>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
      )}

      <div className="space-y-4 mb-8">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border border-secondary-dark/20 p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-semibold text-primary">{item.menu_item.name}</h3>
                {item.customizations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.customizations.map((c, i) => (
                      <span key={i} className="text-xs text-accent bg-primary/5 px-2 py-0.5 rounded">
                        {c.name}
                        {c.price_modifier > 0 && ` +$${c.price_modifier.toFixed(2)}`}
                      </span>
                    ))}
                  </div>
                )}
                {item.special_instructions && (
                  <p className="text-xs text-accent/70 mt-1 italic">
                    Note: {item.special_instructions}
                  </p>
                )}
              </div>
              <span className="font-bold text-accent ml-4">${item.item_total.toFixed(2)}</span>
            </div>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.id)}
                className="text-red-500 hover:text-red-600 text-sm font-medium"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
        <h2 className="font-semibold text-primary text-lg mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-accent">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-accent">
            <span>Tax (included)</span>
            <span>$0.00</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-primary text-lg">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
          {user && (
            <div className="flex justify-between text-primary/70 text-xs pt-1">
              <span>Stars you&apos;ll earn</span>
              <span>+{starsToEarn} stars</span>
            </div>
          )}
        </div>

        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className="w-full mt-6 bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50 text-lg"
        >
          {placing ? 'Placing Order...' : user ? 'Place Order' : 'Sign In to Order'}
        </button>

        {!user && (
          <p className="text-center text-xs text-accent mt-2">
            You need to be signed in to place an order
          </p>
        )}
      </div>

      <div className="mt-4 text-center">
        <Link href="/menu" className="text-primary hover:underline text-sm font-medium">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
