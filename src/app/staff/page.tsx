'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Order, OrderStatus, OrderItem } from '@/lib/types/database'

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']
const READY_TIMEOUT_MINUTES = 15

const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  bg: string
  border: string
  headerBg: string
  headerText: string
}> = {
  pending: {
    label: 'NEW',
    bg: 'bg-white',
    border: 'border-amber-400',
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
  },
  confirmed: {
    label: 'NEW',
    bg: 'bg-white',
    border: 'border-amber-400',
    headerBg: 'bg-amber-500',
    headerText: 'text-white',
  },
  preparing: {
    label: 'MAKING',
    bg: 'bg-white',
    border: 'border-purple-500',
    headerBg: 'bg-purple-600',
    headerText: 'text-white',
  },
  ready: {
    label: 'READY',
    bg: 'bg-white',
    border: 'border-green-500',
    headerBg: 'bg-green-600',
    headerText: 'text-white',
  },
  completed: {
    label: 'DONE',
    bg: 'bg-gray-50',
    border: 'border-gray-300',
    headerBg: 'bg-gray-400',
    headerText: 'text-white',
  },
  cancelled: {
    label: 'CANCELLED',
    bg: 'bg-gray-50',
    border: 'border-red-300',
    headerBg: 'bg-red-500',
    headerText: 'text-white',
  },
}

// Maps status → the previous status for "undo" / move-back
const PREV_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  preparing: 'pending',
  ready: 'preparing',
}

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const { user, profile, loading: authLoading } = useAuthStore()
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  // Track when each order entered "ready" status (orderId → timestamp ms)
  const readyTimestamps = useRef<Map<string, number>>(new Map())

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
      const fetched = (data as Order[]) || []
      setOrders(fetched)
      setLoading(false)

      // Seed ready timestamps for orders already in "ready" state
      const now = Date.now()
      for (const o of fetched) {
        if (o.status === 'ready' && !readyTimestamps.current.has(o.id)) {
          readyTimestamps.current.set(o.id, now)
        }
      }
    }
    fetchOrders()

    const channel = supabase
      .channel('staff-orders-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const o = payload.new as Order
          setOrders(prev => [...prev, o])
          if (o.status === 'ready') {
            readyTimestamps.current.set(o.id, Date.now())
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const o = payload.new as Order
          setOrders(prev => prev.map(old => old.id === o.id ? o : old))
          // Track transition into "ready"
          if (o.status === 'ready' && !readyTimestamps.current.has(o.id)) {
            readyTimestamps.current.set(o.id, Date.now())
          }
          // Clear timestamp if moved out of ready
          if (o.status !== 'ready') {
            readyTimestamps.current.delete(o.id)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          const id = (payload.old as { id: string }).id
          setOrders(prev => prev.filter(o => o.id !== id))
          readyTimestamps.current.delete(id)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, profile, supabase])

  // Tick every 15s for time display + auto-complete check
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 15000)
    return () => clearInterval(interval)
  }, [])

  const updateStatus = useCallback(async (orderId: string, status: OrderStatus) => {
    setUpdatingIds(prev => new Set(prev).add(orderId))
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (!error) {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o))
      if (status === 'ready') {
        readyTimestamps.current.set(orderId, Date.now())
      } else {
        readyTimestamps.current.delete(orderId)
      }
    }
    setUpdatingIds(prev => {
      const next = new Set(prev)
      next.delete(orderId)
      return next
    })
  }, [supabase])

  // Auto-complete ready orders past the timeout
  useEffect(() => {
    const now = Date.now()
    const timeoutMs = READY_TIMEOUT_MINUTES * 60 * 1000
    for (const order of orders) {
      if (order.status === 'ready') {
        const readySince = readyTimestamps.current.get(order.id)
        if (readySince && now - readySince >= timeoutMs && !updatingIds.has(order.id)) {
          updateStatus(order.id, 'completed')
        }
      }
    }
  }) // runs on every render/tick

  if (authLoading || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="text-accent">Loading order queue...</div>
      </div>
    )
  }

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const completedOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled')

  const newOrders = activeOrders.filter(o => o.status === 'pending' || o.status === 'confirmed')
  const makingOrders = activeOrders.filter(o => o.status === 'preparing')
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
        {/* Status summary bar — 3 columns */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-center">
            <p className="text-3xl font-black text-amber-700">{newOrders.length}</p>
            <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">New</p>
          </div>
          <div className="rounded-xl border-2 border-purple-500 bg-purple-50 px-4 py-3 text-center">
            <p className="text-3xl font-black text-purple-700">{makingOrders.length}</p>
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider">Making</p>
          </div>
          <div className="rounded-xl border-2 border-green-500 bg-green-50 px-4 py-3 text-center">
            <p className="text-3xl font-black text-green-700">{readyOrders.length}</p>
            <p className="text-xs font-bold text-green-600 uppercase tracking-wider">Ready</p>
          </div>
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
                const priority: Record<string, number> = { pending: 0, confirmed: 0, preparing: 1, ready: 2 }
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
                  readySince={readyTimestamps.current.get(order.id)}
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

function OrderCard({
  order,
  onUpdateStatus,
  isUpdating,
  readySince,
}: {
  order: Order
  onUpdateStatus: (id: string, status: OrderStatus) => void
  isUpdating: boolean
  readySince?: number
}) {
  const config = STATUS_CONFIG[order.status]
  const items = Array.isArray(order.items) ? (order.items as OrderItem[]) : []
  const timeSince = getTimeSince(order.created_at)
  const isNew = order.status === 'pending' || order.status === 'confirmed'
  const isPreparing = order.status === 'preparing'
  const isReady = order.status === 'ready'
  const isDone = order.status === 'completed' || order.status === 'cancelled'
  const isUrgent = isNew && getMinutesSince(order.created_at) >= 5
  const customerName = order.customer_name || 'Guest'
  const prevStatus = PREV_STATUS[order.status]

  // Countdown for ready orders
  let readyMinLeft = 0
  if (isReady && readySince) {
    const elapsed = Math.floor((Date.now() - readySince) / 60000)
    readyMinLeft = Math.max(0, READY_TIMEOUT_MINUTES - elapsed)
  }

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden transition-all shadow-sm ${isUpdating ? 'opacity-60 scale-[0.98]' : ''} ${isUrgent ? 'ring-2 ring-red-400 ring-offset-2' : ''}`}>
      {/* Colored header band with status + customer name */}
      <div className={`${config.headerBg} ${config.headerText} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest opacity-90">{config.label}</span>
          <span className="text-xs font-mono opacity-70">#{order.id.slice(0, 8)}</span>
        </div>
        <p className="text-lg font-black mt-1 leading-tight truncate">{customerName}</p>
      </div>

      {/* Time — prominent */}
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
        <svg className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-red-500' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-gray-700'}`}>{timeSince}</span>
        {isUrgent && <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-0.5 rounded-full ml-auto">URGENT</span>}
      </div>

      {/* Items list */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="bg-gray-900 text-white text-xs font-black w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                {item.quantity || 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 leading-tight">{item.menu_item_name}</p>
                {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                  <p className="text-xs text-gray-600 leading-tight mt-0.5 font-medium">
                    {item.customizations.map(c => c.name).join(' · ')}
                  </p>
                )}
                {item.special_instructions && (
                  <div className="text-xs font-bold text-amber-800 bg-amber-100 rounded-md px-2 py-1 mt-1 leading-tight">
                    NOTE: {item.special_instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-4 py-2 border-t border-gray-200 flex items-center justify-between bg-gray-50">
        <span className="text-sm font-semibold text-gray-600">
          {items.reduce((sum, it) => sum + (it.quantity || 1), 0)} item{items.reduce((sum, it) => sum + (it.quantity || 1), 0) !== 1 ? 's' : ''}
        </span>
        <span className="font-black text-gray-900">${order.total.toFixed(2)}</span>
      </div>

      {/* Action buttons */}
      <div className="px-4 pb-4 pt-3 space-y-2">
        {/* New orders → Start Making */}
        {isNew && (
          <>
            <div className="flex gap-2">
              <button
                onClick={() => onUpdateStatus(order.id, 'preparing')}
                disabled={isUpdating}
                className="flex-1 py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200 active:scale-[0.97]"
              >
                {isUpdating ? 'Updating...' : 'Start Making'}
              </button>
              <button
                onClick={() => onUpdateStatus(order.id, 'cancelled')}
                disabled={isUpdating}
                className="px-4 py-3 rounded-xl text-sm font-bold text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Preparing → Mark Ready + Move Back */}
        {isPreparing && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, 'ready')}
              disabled={isUpdating}
              className="w-full py-3 rounded-xl text-sm font-black transition-all disabled:opacity-50 bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-200 active:scale-[0.97]"
            >
              {isUpdating ? 'Updating...' : 'Mark Ready for Pickup'}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'pending')}
              disabled={isUpdating}
              className="w-full py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Move Back to New
            </button>
          </>
        )}

        {/* Ready — countdown + move back */}
        {isReady && (
          <>
            <div className="text-center py-1.5 space-y-1">
              <span className="text-green-700 font-bold text-sm block">Waiting for customer pickup</span>
              {readySince && (
                <span className="text-xs text-gray-400 block">
                  Auto-completes in {readyMinLeft > 0 ? `${readyMinLeft} min` : 'moments'}
                </span>
              )}
            </div>
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={isUpdating}
              className="w-full py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Move Back to Making
            </button>
          </>
        )}

        {/* Completed/Cancelled — no main action, but allow reopening */}
        {isDone && (
          <button
            onClick={() => onUpdateStatus(order.id, 'pending')}
            disabled={isUpdating}
            className="w-full py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reopen Order
          </button>
        )}
      </div>
    </div>
  )
}

function getMinutesSince(dateStr: string): number {
  const now = new Date()
  const then = new Date(dateStr)
  return Math.floor((now.getTime() - then.getTime()) / 60000)
}

function getTimeSince(dateStr: string): string {
  const diffMin = getMinutesSince(dateStr)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`
  return new Date(dateStr).toLocaleDateString()
}
