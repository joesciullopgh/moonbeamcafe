'use client'

import { useState, useEffect } from 'react'
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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { user, loading: authLoading } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }

    if (!user) return

    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      setOrders((data as Order[]) || [])
      setLoading(false)
    }
    fetchOrders()
  }, [user, authLoading, router, supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading orders...</div>
      </div>
    )
  }

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
        <div className="space-y-4">
          {orders.map(order => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-xl border border-secondary-dark/20 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-accent">Order #{order.id.slice(0, 8)}</p>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
      )}
    </div>
  )
}
