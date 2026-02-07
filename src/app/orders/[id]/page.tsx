'use client'

import { useState, useEffect, use, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Order, OrderStatus, OrderItem } from '@/lib/types/database'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  preparing: 'In Progress',
  ready: 'Ready for Pickup',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed']
const STEP_LABELS = ['Received', 'Confirmed', 'In Progress', 'Ready', 'Complete']

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [order, setOrder] = useState<Order | null>(null)
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

    async function fetchOrder() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single()
      setOrder(data as Order)
      setLoading(false)
    }
    fetchOrder()

    // Subscribe to changes
    const channel = supabase
      .channel(`order-${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${id}` },
        (payload) => {
          setOrder(payload.new as Order)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, authLoading, router, supabase, id])

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading order...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Order not found.</div>
      </div>
    )
  }

  const currentStep = STATUS_STEPS.indexOf(order.status)

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-8">
      <Link href="/orders" className="text-primary hover:underline text-sm font-medium mb-4 inline-block">
        &larr; Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Order #{order.id.slice(0, 8)}</h1>
        <span className={`px-3 py-1.5 rounded-full text-sm font-bold ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Ready for pickup banner */}
      {order.status === 'ready' && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-5 mb-6 text-center">
          <p className="text-green-800 text-xl font-bold">Your order is ready for pickup!</p>
          <p className="text-green-700 text-sm mt-1">Head to the counter to grab your order.</p>
        </div>
      )}

      {/* Being prepared banner */}
      {order.status === 'preparing' && (
        <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-4 mb-6 text-center">
          <p className="text-purple-800 text-lg font-semibold">Your order is being prepared</p>
          <p className="text-purple-600 text-sm mt-1">We&apos;ll let you know when it&apos;s ready.</p>
        </div>
      )}

      {/* Status Progress */}
      {order.status !== 'cancelled' && (
        <div className="bg-white rounded-xl border border-secondary-dark/20 p-6 mb-6">
          <h2 className="text-sm font-semibold text-primary mb-4">Order Progress</h2>
          <div className="flex items-center justify-between">
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      i <= currentStep
                        ? 'bg-primary text-secondary'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {i < currentStep ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="text-[10px] text-accent mt-1 hidden sm:block">{STEP_LABELS[i]}</span>
                </div>
                {i < STATUS_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 p-6 mb-6">
        <h2 className="text-sm font-semibold text-primary mb-4">Items</h2>
        <div className="space-y-3">
          {Array.isArray(order.items) && (order.items as OrderItem[]).map((item, i) => (
            <div key={i} className="flex justify-between items-start">
              <div>
                <p className="font-medium text-text-dark">
                  {item.quantity || 1}x {item.menu_item_name}
                </p>
                {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {item.customizations.map((c, j) => (
                      <span key={j} className="text-xs text-accent bg-primary/5 px-2 py-0.5 rounded">
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
              <span className="text-accent font-medium">${(item.item_total || 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Order Summary */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-accent">
            <span>Ordered</span>
            <span>{new Date(order.created_at).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-accent">
            <span>Stars Earned</span>
            <span>+{order.stars_earned}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-primary text-lg">
            <span>Total</span>
            <span>${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
