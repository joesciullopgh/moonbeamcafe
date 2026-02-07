'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Order, OrderStatus, OrderItem } from '@/lib/types/database'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  preparing: 'bg-purple-100 text-purple-700',
  ready: 'bg-green-100 text-green-700',
  completed: 'bg-gray-100 text-gray-600',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'completed']

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const supabase = createClient()

  useEffect(() => {
    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
      setOrders((data as Order[]) || [])
      setLoading(false)
    }
    fetchOrders()
  }, [supabase])

  async function updateStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    }
  }

  function getNextStatus(current: OrderStatus): OrderStatus | null {
    const idx = STATUS_FLOW.indexOf(current)
    if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[idx + 1]
  }

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  if (loading) {
    return <div className="text-accent">Loading orders...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Order Management</h1>

      {/* Status Filters */}
      <div className="flex overflow-x-auto gap-2 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
            statusFilter === 'all' ? 'bg-primary text-secondary' : 'bg-secondary text-primary hover:bg-secondary-dark'
          }`}
        >
          All ({orders.length})
        </button>
        {STATUS_FLOW.map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              statusFilter === status ? 'bg-primary text-secondary' : 'bg-secondary text-primary hover:bg-secondary-dark'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)} ({orders.filter(o => o.status === status).length})
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="space-y-4">
        {filteredOrders.map(order => (
          <div key={order.id} className="bg-white rounded-xl border border-secondary-dark/20 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <p className="text-sm text-accent">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-accent/70">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
                <span className="font-bold text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Order Items */}
            <div className="space-y-1 mb-3">
              {Array.isArray(order.items) && (order.items as OrderItem[]).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-text-dark">
                    {item.quantity || 1}x {item.menu_item_name}
                    {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                      <span className="text-accent text-xs ml-1">
                        ({item.customizations.map(c => c.name).join(', ')})
                      </span>
                    )}
                  </span>
                  <span className="text-accent">${(item.item_total || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {getNextStatus(order.status) && (
                <button
                  onClick={() => updateStatus(order.id, getNextStatus(order.status)!)}
                  className="bg-primary text-secondary px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-light transition-colors"
                >
                  Mark as {getNextStatus(order.status)!.charAt(0).toUpperCase() + getNextStatus(order.status)!.slice(1)}
                </button>
              )}
              {order.status !== 'cancelled' && order.status !== 'completed' && (
                <button
                  onClick={() => updateStatus(order.id, 'cancelled')}
                  className="text-red-600 hover:text-red-700 px-4 py-1.5 text-xs font-medium"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-accent">No orders found.</div>
        )}
      </div>
    </div>
  )
}
