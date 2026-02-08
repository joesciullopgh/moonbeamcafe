'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/stores/cart-store'
import { useAuthStore } from '@/stores/auth-store'
import { useStoreStatus } from '@/hooks/useStoreStatus'

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore()
  const { user, profile, setProfile } = useAuthStore()
  const { status: storeStatus } = useStoreStatus()
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const storeClosed = storeStatus && !storeStatus.isOpen

  const total = getTotal()
  const starsToEarn = Math.floor(total)

  // Check if profile has required billing info
  const hasBillingInfo = profile?.phone && profile?.billing_address_line1 && profile?.billing_city && profile?.billing_state && profile?.billing_zip
  const hasName = profile?.first_name && profile?.last_name

  async function handlePlaceOrder() {
    if (storeClosed) {
      setError('Sorry, the store is currently closed. Please try again during business hours.')
      return
    }

    if (!user) {
      router.push('/login')
      return
    }

    if (!acceptedTerms) {
      setError('Please accept the Terms of Service and Privacy Policy to continue.')
      return
    }

    if (!hasName || !hasBillingInfo) {
      setError('Please complete your profile with billing information before placing an order.')
      return
    }

    setPlacing(true)
    setError('')

    // Record terms acceptance if not already done
    if (profile && !profile.accepted_terms_at) {
      await supabase
        .from('profiles')
        .update({ accepted_terms_at: new Date().toISOString() })
        .eq('id', user.id)
    }

    const orderItems = items.map(item => ({
      menu_item_id: item.menu_item.id,
      menu_item_name: item.menu_item.name,
      quantity: item.quantity,
      customizations: item.customizations,
      special_instructions: item.special_instructions,
      item_total: item.item_total,
    }))

    const customerName = profile
      ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
      : null

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        customer_name: customerName,
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

      {storeClosed && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold text-red-800 text-sm">Store is currently closed</p>
              <p className="text-red-700 text-sm mt-1">{storeStatus.message}</p>
              {storeStatus.opensAtNext && (
                <p className="text-red-600 text-xs mt-2">
                  We open again {storeStatus.opensAtNext}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
      )}

      {/* Cart Items */}
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

      {/* Billing Info Check */}
      {user && (!hasName || !hasBillingInfo) && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-bold text-amber-800 text-sm">Billing information required</p>
              <p className="text-amber-700 text-sm mt-1">
                Please complete your name, phone, and billing address before placing an order.
              </p>
              <Link
                href="/profile"
                className="inline-block mt-3 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-amber-700 transition-colors"
              >
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method — placeholder for future payment provider */}
      {user && hasName && hasBillingInfo && (
        <div className="bg-white rounded-xl border border-secondary-dark/20 p-6 mb-6">
          <h2 className="font-semibold text-primary text-lg mb-4">Payment Method</h2>

          {/* Card input placeholder — will be replaced by Stripe/Square Elements */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center bg-gray-50">
            <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <p className="text-sm font-semibold text-gray-500">Credit card payment coming soon</p>
            <p className="text-xs text-gray-400 mt-1">Payment will be collected at pickup for now</p>
          </div>

          {/* Billing summary from profile */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Billing Address</p>
            <p className="text-sm text-gray-700">
              {profile?.first_name} {profile?.last_name}
            </p>
            <p className="text-sm text-gray-600">
              {profile?.billing_address_line1}
              {profile?.billing_address_line2 && `, ${profile.billing_address_line2}`}
            </p>
            <p className="text-sm text-gray-600">
              {profile?.billing_city}, {profile?.billing_state} {profile?.billing_zip}
            </p>
            <p className="text-sm text-gray-600">{profile?.phone}</p>
            <Link href="/profile" className="text-xs text-primary font-medium hover:underline mt-1 inline-block">
              Edit billing info
            </Link>
          </div>
        </div>
      )}

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

        {/* Terms acceptance */}
        {user && (
          <label className="flex items-start gap-3 mt-5 pt-4 border-t border-gray-100 cursor-pointer">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-xs text-gray-500 leading-relaxed">
              I agree to the{' '}
              <Link href="/terms" className="text-primary underline font-medium" target="_blank">Terms of Service</Link>,{' '}
              <Link href="/privacy" className="text-primary underline font-medium" target="_blank">Privacy Policy</Link>, and{' '}
              <Link href="/refunds" className="text-primary underline font-medium" target="_blank">Refund Policy</Link>.
              I authorize Moonbeam Cafe to charge the total amount shown above.
            </span>
          </label>
        )}

        <button
          onClick={handlePlaceOrder}
          disabled={placing || !!storeClosed || (user ? !acceptedTerms || !hasName || !hasBillingInfo : false)}
          className="w-full mt-6 bg-primary text-secondary py-3.5 rounded-xl font-bold hover:bg-primary-light transition-colors disabled:opacity-50 text-lg shadow-md shadow-primary/15"
        >
          {storeClosed ? 'Store Closed' : placing ? 'Placing Order...' : user ? 'Place Order' : 'Sign In to Order'}
        </button>

        {!user && (
          <p className="text-center text-xs text-accent mt-2">
            You need to be signed in to place an order
          </p>
        )}

        {user && (
          <div className="flex items-center justify-center gap-4 mt-4">
            <svg className="w-5 h-3 text-gray-400" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="4" fill="currentColor" opacity="0.15"/><text x="19" y="15" textAnchor="middle" fill="currentColor" fontSize="8" fontWeight="bold">VISA</text></svg>
            <svg className="w-5 h-3 text-gray-400" viewBox="0 0 38 24" fill="none"><rect width="38" height="24" rx="4" fill="currentColor" opacity="0.15"/><text x="19" y="15" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="bold">MC</text></svg>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-xs text-gray-400">Secure checkout</span>
          </div>
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
