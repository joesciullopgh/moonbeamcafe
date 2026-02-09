'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Order, OrderStatus } from '@/lib/types/database'

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
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

    let done = false
    async function fetchOrders() {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
        if (!done) setOrders((data as Order[]) || [])
      } catch {
        // fail silently, show empty orders
      } finally {
        done = true
        setLoading(false)
      }
    }
    fetchOrders()
    const timer = setTimeout(() => {
      if (!done) { done = true; setLoading(false) }
    }, 8000)

    // Realtime: listen for updates to user's orders
    const channel = supabase
      .channel('customer-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? payload.new as Order : o))
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => {
          setOrders(prev => [payload.new as Order, ...prev])
        }
      )
      .subscribe()

    return () => {
      done = true
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [user, authLoading, router, supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading orders...</div>
      </div>
    )
  }

  // Separate active vs past orders
  const activeOrders = orders.filter(o => !['completed', 'cancelled'].includes(o.status))
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  return (
    <div className="min-h-[80vh] max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-primary mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-accent mb-6">You haven&apos;t placed any orders yet.</p>
          <Link
            href="/menu"
            className="inline-block bg-primary text-secondary px-6 py-3 rounded-full font-semibold hover:bg-primary-light transition-colors"
          >
            Browse Menu
          </Link>
        </div>
      ) : (
        <>
          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-primary">Active Orders</h2>
              </div>
              <div className="space-y-4">
                {activeOrders.map(order => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className={`block rounded-xl border-2 p-5 hover:shadow-md transition-all ${
                      order.status === 'ready'
                        ? 'border-green-400 bg-green-50'
                        : order.status === 'preparing'
                        ? 'border-purple-300 bg-purple-50'
                        : order.status === 'confirmed'
                        ? 'border-blue-300 bg-blue-50'
                        : 'border-amber-300 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-mono text-gray-500">Order #{order.id.slice(0, 8)}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    {order.status === 'ready' && (
                      <div className="bg-green-100 text-green-800 rounded-lg px-3 py-2 text-sm font-semibold mb-2 text-center">
                        Your order is ready for pickup!
                      </div>
                    )}
                    {order.status === 'preparing' && (
                      <div className="bg-purple-100 text-purple-800 rounded-lg px-3 py-2 text-sm font-medium mb-2 text-center">
                        Being prepared now...
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      {Array.isArray(order.items) && order.items.length} item{Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past Orders */}
          {pastOrders.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-primary mb-4">Past Orders</h2>
              <div className="space-y-3">
                {pastOrders.map(order => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-xl border border-secondary-dark/20 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-accent">Order #{order.id.slice(0, 8)}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-accent/70">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="font-bold text-primary">${order.total.toFixed(2)}</p>
                    </div>
                    <div className="mt-2 text-sm text-accent">
                      {Array.isArray(order.items) && order.items.length} item{Array.isArray(order.items) && order.items.length !== 1 ? 's' : ''}
                      {order.stars_earned > 0 && (
                        <span className="ml-2 text-xs text-primary/70">+{order.stars_earned} stars earned</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
