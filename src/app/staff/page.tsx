'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Order, OrderStatus, OrderItem } from '@/lib/types/database'

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']

const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  bg: string
  border: string
  badge: string
  icon: string
}> = {
  pending: {
    label: 'New Order',
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    badge: 'bg-amber-100 text-amber-800',
    icon: '🔔',
  },
  confirmed: {
    label: 'Confirmed',
    bg: 'bg-blue-50',
    border: 'border-blue-300',
    badge: 'bg-blue-100 text-blue-800',
    icon: '✓',
  },
  preparing: {
    label: 'In Progress',
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    badge: 'bg-purple-100 text-purple-800',
    icon: '☕',
  },
  ready: {
    label: 'Ready',
    bg: 'bg-green-50',
    border: 'border-green-400',
    badge: 'bg-green-100 text-green-800',
    icon: '✅',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    badge: 'bg-gray-100 text-gray-600',
    icon: '📦',
  },
  cancelled: {
    label: 'Cancelled',
    bg: 'bg-red-50',
    border: 'border-red-200',
    badge: 'bg-red-100 text-red-700',
    icon: '✕',
  },
}

const NEXT_ACTION: Record<string, { status: OrderStatus; label: string; color: string }> = {
  pending: { status: 'confirmed', label: 'Accept Order', color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  confirmed: { status: 'preparing', label: 'Start Making', color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  preparing: { status: 'ready', label: 'Mark Ready', color: 'bg-green-600 hover:bg-green-700 text-white' },
  ready: { status: 'completed', label: 'Complete', color: 'bg-gray-600 hover:bg-gray-700 text-white' },
}

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const { user, profile, loading: authLoading } = useAuthStore()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Auth gate
  useEffect(() => {
    if (!authLoading && (!user || !profile)) {
      router.push('/login')
      return
    }
    if (!authLoading && profile && profile.role === 'customer') {
      router.push('/')
    }
  }, [user, profile, authLoading, router])

  // Fetch orders + realtime subscription
  useEffect(() => {
    if (!user || !profile) return

    async function fetchOrders() {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true })
      setOrders((data as Order[]) || [])
      setLoading(false)
    }
    fetchOrders()

    // Subscribe to ALL order changes in realtime
    const channel = supabase
      .channel('staff-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => [...prev, payload.new as Order])
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => prev.map(o => o.id === (payload.new as Order).id ? payload.new as Order : o))
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          setOrders(prev => prev.filter(o => o.id !== (payload.old as { id: string }).id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, supabase])

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setUpdatingIds(prev => new Set(prev).add(orderId))
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (!error) {
      // Optimistic update (realtime will also fire)
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
    }
    setUpdatingIds(prev => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }, [supabase])

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading order queue...</div>
      </div>
    )
  }

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled')

  // Group by status for the column view
  const pendingOrders = activeOrders.filter(o => o.status === 'pending')
  const confirmedOrders = activeOrders.filter(o => o.status === 'confirmed')
  const preparingOrders = activeOrders.filter(o => o.status === 'preparing')
  const readyOrders = activeOrders.filter(o => o.status === 'ready')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top bar */}
      <div className="bg-primary text-secondary px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Order Queue</h1>
            <p className="text-secondary/70 text-sm">{activeOrders.length} active order{activeOrders.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-secondary/70">Live</span>
            </div>
            <button
              onClick={() => router.push('/')}
              className="text-secondary/70 hover:text-white text-sm transition-colors"
            >
              Back to site
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status summary bar */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <StatusCount label="New" count={pendingOrders.length} color="bg-amber-100 text-amber-800 border-amber-300" />
          <StatusCount label="Confirmed" count={confirmedOrders.length} color="bg-blue-100 text-blue-800 border-blue-300" />
          <StatusCount label="In Progress" count={preparingOrders.length} color="bg-purple-100 text-purple-800 border-purple-300" />
          <StatusCount label="Ready" count={readyOrders.length} color="bg-green-100 text-green-800 border-green-300" />
        </div>

        {/* Active Orders — card grid */}
        {activeOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 text-lg">No active orders</p>
            <p className="text-gray-400 text-sm mt-1">New orders will appear here in real time</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOrders
              .sort((a, b) => {
                // Sort by status priority, then by time
                const priority: Record<string, number> = { pending: 0, confirmed: 1, preparing: 2, ready: 3 }
                const pDiff = (priority[a.status] ?? 99) - (priority[b.status] ?? 99)
                if (pDiff !== 0) return pDiff
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              })
              .map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={updateStatus}
                  isUpdating={updatingIds.has(order.id)}
                />
              ))}
          </div>
        )}

        {/* Completed orders toggle */}
        {completedOrders.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <svg className={`w-4 h-4 transition-transform ${showCompleted ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Completed / Cancelled ({completedOrders.length})
            </button>

            {showCompleted && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {completedOrders
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .slice(0, 20)
                  .map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      onUpdateStatus={updateStatus}
                      isUpdating={updatingIds.has(order.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function StatusCount({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <div className={`rounded-xl border px-4 py-3 text-center ${color}`}>
      <p className="text-2xl font-bold">{count}</p>
      <p className="text-xs font-medium opacity-80">{label}</p>
    </div>
  )
}

function OrderCard({
  order,
  onUpdateStatus,
  isUpdating,
}: {
  order: Order
  onUpdateStatus: (id: string, status: OrderStatus) => void
  isUpdating: boolean
}) {
  const config = STATUS_CONFIG[order.status]
  const nextAction = NEXT_ACTION[order.status]
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []
  const timeSince = getTimeSince(order.created_at)

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden transition-all ${isUpdating ? 'opacity-60 scale-[0.98]' : ''}`}>
      {/* Card header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500 font-mono">#{order.id.slice(0, 8)}</p>
          <p className="text-xs text-gray-400 mt-0.5">{timeSince}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.badge}`}>
          {config.icon} {config.label}
        </span>
      </div>

      {/* Items list */}
      <div className="px-4 pb-3">
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="bg-white/70 text-xs font-bold text-gray-600 w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5">
                {item.quantity || 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-tight">{item.menu_item_name}</p>
                {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                    {item.customizations.map(c => c.name).join(' · ')}
                  </p>
                )}
                {item.special_instructions && (
                  <p className="text-xs text-amber-700 bg-amber-100/60 rounded px-1.5 py-0.5 mt-1 leading-tight">
                    📝 {item.special_instructions}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-4 py-2 border-t border-black/5 flex items-center justify-between">
        <span className="text-sm text-gray-500">{items.reduce((sum, it) => sum + (it.quantity || 1), 0)} item{items.reduce((sum, it) => sum + (it.quantity || 1), 0) !== 1 ? 's' : ''}</span>
        <span className="font-bold text-gray-800">${order.total.toFixed(2)}</span>
      </div>

      {/* Action buttons */}
      {nextAction && (
        <div className="px-4 pb-4 pt-2 flex gap-2">
          <button
            onClick={() => onUpdateStatus(order.id, nextAction.status)}
            disabled={isUpdating}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${nextAction.color} shadow-sm`}
          >
            {isUpdating ? 'Updating...' : nextAction.label}
          </button>
          {order.status !== 'ready' && (
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              disabled={isUpdating}
              className="px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 bg-white border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function getTimeSince(dateStr: string): string {
  const now = new Date()
  const then = new Date(dateStr)
  const diffMs = now.getTime() - then.getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`
  return then.toLocaleDateString()
}
