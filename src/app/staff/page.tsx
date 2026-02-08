'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useStoreStatus } from '@/hooks/useStoreStatus'
import type { Order, OrderStatus, OrderItem } from '@/lib/types/database'

const ACTIVE_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready']
const READY_TIMEOUT_MINUTES = 15

/*
 * ─── Staff Queue Semantic Palette ─────────────────────────
 *   Brand  (nav bar, primary actions):  primary / primary-light
 *   Page bg:  secondary (warm latte)    Card surface: white
 *
 *   Status headers (all ≥ WCAG AA 4.5:1 with white text):
 *     NEW     → amber-700   #b45309   (~5.0 : 1)
 *     MAKING  → sky-700     #0369a1   (~5.9 : 1)
 *     READY   → green-700   #15803d   (~5.1 : 1)
 *     DONE    → stone-400   #a8a29e   (muted, no action)
 *
 *   Danger (urgent ring, cancel btn): red-700 #b91c1c
 * ──────────────────────────────────────────────────────────
 */
const STATUS_CONFIG: Record<OrderStatus, {
  label: string
  bg: string
  border: string
  headerBg: string
  headerText: string
  accent: string
}> = {
  pending: {
    label: 'NEW',
    bg: 'bg-white',
    border: 'border-amber-200',
    headerBg: 'bg-amber-700',
    headerText: 'text-white',
    accent: 'text-amber-800',
  },
  confirmed: {
    label: 'NEW',
    bg: 'bg-white',
    border: 'border-amber-200',
    headerBg: 'bg-amber-700',
    headerText: 'text-white',
    accent: 'text-amber-800',
  },
  preparing: {
    label: 'MAKING',
    bg: 'bg-white',
    border: 'border-sky-200',
    headerBg: 'bg-sky-700',
    headerText: 'text-white',
    accent: 'text-sky-800',
  },
  ready: {
    label: 'READY',
    bg: 'bg-white',
    border: 'border-green-200',
    headerBg: 'bg-green-700',
    headerText: 'text-white',
    accent: 'text-green-800',
  },
  completed: {
    label: 'DONE',
    bg: 'bg-stone-50',
    border: 'border-stone-200',
    headerBg: 'bg-stone-400',
    headerText: 'text-white',
    accent: 'text-stone-400',
  },
  cancelled: {
    label: 'CANCELLED',
    bg: 'bg-stone-50',
    border: 'border-stone-200',
    headerBg: 'bg-stone-400',
    headerText: 'text-white',
    accent: 'text-stone-400',
  },
}

const PREV_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  preparing: 'pending',
  ready: 'preparing',
}

type ProfileMap = Record<string, { first_name: string | null; last_name: string | null; email: string }>

export default function StaffDashboardPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [profiles, setProfiles] = useState<ProfileMap>({})
  const [loading, setLoading] = useState(true)
  const [showReady, setShowReady] = useState(true)
  const [showCompleted, setShowCompleted] = useState(false)
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set())
  const { user, profile, loading: authLoading } = useAuthStore()
  const { status: storeStatus, toggleForcedClosed, loading: storeStatusLoading } = useStoreStatus()
  const [closeReason, setCloseReason] = useState('break')
  const [toggling, setToggling] = useState(false)
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

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

  // Fetch orders + profiles + realtime subscription
  useEffect(() => {
    if (!user || !profile) return

    async function fetchData() {
      const [ordersRes, profilesRes] = await Promise.all([
        supabase.from('orders').select('*').order('created_at', { ascending: true }),
        supabase.from('profiles').select('id, first_name, last_name, email'),
      ])

      const fetched = (ordersRes.data as Order[]) || []
      setOrders(fetched)

      // Build a lookup map: user_id → { first_name, last_name, email }
      const pMap: ProfileMap = {}
      for (const p of profilesRes.data || []) {
        pMap[p.id] = p
      }
      setProfiles(pMap)

      setLoading(false)

      const now = Date.now()
      for (const o of fetched) {
        if (o.status === 'ready' && !readyTimestamps.current.has(o.id)) {
          readyTimestamps.current.set(o.id, now)
        }
      }
    }
    fetchData()

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
          if (o.status === 'ready' && !readyTimestamps.current.has(o.id)) {
            readyTimestamps.current.set(o.id, Date.now())
          }
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

  // Tick every 15s
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
  })

  // Resolve display name: order.customer_name → profile lookup → "Guest"
  const getCustomerName = useCallback((order: Order) => {
    if (order.customer_name) return order.customer_name
    const p = profiles[order.user_id]
    if (p) {
      const name = [p.first_name, p.last_name].filter(Boolean).join(' ')
      return name || p.email
    }
    return 'Guest'
  }, [profiles])

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
    <div className="min-h-screen bg-secondary">
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
              className="text-secondary/70 hover:text-white text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-secondary/50 rounded"
            >
              Back to site
            </button>
          </div>
        </div>
      </div>

      {/* Store Open/Closed Banner */}
      {storeStatus && !storeStatusLoading && (
        <div className={`px-4 sm:px-6 py-3 border-b ${
          storeStatus.isOpen
            ? 'bg-green-50 border-green-200'
            : storeStatus.isForcedClosed
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                storeStatus.isOpen ? 'bg-green-500' : storeStatus.isForcedClosed ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              <span className={`text-sm font-bold ${
                storeStatus.isOpen ? 'text-green-800' : storeStatus.isForcedClosed ? 'text-red-800' : 'text-amber-800'
              }`}>
                {storeStatus.message}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {storeStatus.isOpen && !storeStatus.isForcedClosed && (
                <>
                  <select
                    value={closeReason}
                    onChange={e => setCloseReason(e.target.value)}
                    className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <option value="break">Break</option>
                    <option value="emergency">Emergency</option>
                    <option value="staffing">Staffing</option>
                    <option value="other">Other</option>
                  </select>
                  <button
                    onClick={async () => { setToggling(true); await toggleForcedClosed(closeReason); setToggling(false) }}
                    disabled={toggling}
                    className="text-xs font-bold text-red-700 bg-red-100 border border-red-300 px-3 py-1.5 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-red-600"
                  >
                    {toggling ? 'Closing...' : 'Close Store'}
                  </button>
                </>
              )}
              {storeStatus.isForcedClosed && (
                <button
                  onClick={async () => { setToggling(true); await toggleForcedClosed(); setToggling(false) }}
                  disabled={toggling}
                  className="text-xs font-bold text-green-700 bg-green-100 border border-green-300 px-3 py-1.5 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-green-600"
                >
                  {toggling ? 'Reopening...' : 'Reopen Store'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Status summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border-2 border-amber-300 bg-amber-50 px-4 py-3 text-center">
            <p className="text-3xl font-black text-amber-800">{newOrders.length}</p>
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider">New</p>
          </div>
          <div className="rounded-xl border-2 border-sky-300 bg-sky-50 px-4 py-3 text-center">
            <p className="text-3xl font-black text-sky-800">{makingOrders.length}</p>
            <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Making</p>
          </div>
          <div className="rounded-xl border-2 border-green-300 bg-green-50 px-4 py-3 text-center">
            <p className="text-3xl font-black text-green-800">{readyOrders.length}</p>
            <p className="text-xs font-bold text-green-700 uppercase tracking-wider">Ready</p>
          </div>
        </div>

        {/* Active Orders (New + Making only) */}
        {newOrders.length === 0 && makingOrders.length === 0 && readyOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-secondary-dark/20">
            <svg className="w-16 h-16 text-primary/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-accent text-lg">No active orders</p>
            <p className="text-accent/60 text-sm mt-1">New orders will appear here in real time</p>
          </div>
        ) : (newOrders.length > 0 || makingOrders.length > 0) ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...newOrders, ...makingOrders]
              .sort((a, b) => {
                const priority: Record<string, number> = { pending: 0, confirmed: 0, preparing: 1 }
                const pDiff = (priority[a.status] ?? 99) - (priority[b.status] ?? 99)
                if (pDiff !== 0) return pDiff
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              })
              .map(order => (
                <OrderCard
                  key={order.id}
                  order={order}
                  customerName={getCustomerName(order)}
                  onUpdateStatus={updateStatus}
                  isUpdating={updatingIds.has(order.id)}
                />
              ))}
          </div>
        ) : null}

        {/* Ready for Pickup — collapsible section */}
        {readyOrders.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowReady(!showReady)}
              className="flex items-center gap-2 text-sm font-bold text-green-800 hover:text-green-900 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600 rounded"
            >
              <svg className={`w-4 h-4 transition-transform ${showReady ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Ready for Pickup ({readyOrders.length})
            </button>

            {showReady && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-4">
                {readyOrders
                  .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                  .map(order => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      customerName={getCustomerName(order)}
                      onUpdateStatus={updateStatus}
                      isUpdating={updatingIds.has(order.id)}
                      readySince={readyTimestamps.current.get(order.id)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Completed orders toggle */}
        {completedOrders.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm text-stone-600 hover:text-primary font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400 rounded"
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
                      customerName={getCustomerName(order)}
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
  customerName,
  onUpdateStatus,
  isUpdating,
  readySince,
}: {
  order: Order
  customerName: string
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

  let readyMinLeft = 0
  if (isReady && readySince) {
    const elapsed = Math.floor((Date.now() - readySince) / 60000)
    readyMinLeft = Math.max(0, READY_TIMEOUT_MINUTES - elapsed)
  }

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} overflow-hidden transition-all shadow-sm hover:shadow-md ${isUpdating ? 'opacity-60 scale-[0.98]' : ''} ${isUrgent ? 'ring-2 ring-red-600 ring-offset-2' : ''}`}>
      {/* Header */}
      <div className={`${config.headerBg} ${config.headerText} px-4 py-3`}>
        <span className="text-xs font-black uppercase tracking-widest">{config.label}</span>
        <p className="text-lg font-black mt-1 leading-tight truncate">{customerName}</p>
      </div>

      {/* Time */}
      <div className={`px-4 py-2.5 flex items-center gap-2 border-b ${isUrgent ? 'bg-red-50 border-red-200' : 'bg-secondary border-secondary-dark/10'}`}>
        <svg className={`w-4 h-4 shrink-0 ${isUrgent ? 'text-red-500' : 'text-accent/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className={`text-sm font-bold ${isUrgent ? 'text-red-600' : 'text-text-dark'}`}>{timeSince}</span>
        {isUrgent && <span className="text-xs font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded-full ml-auto">URGENT</span>}
      </div>

      {/* Items */}
      <div className="px-4 py-3">
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="bg-primary text-secondary text-xs font-black w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5">
                {item.quantity || 1}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-text-dark leading-tight">{item.menu_item_name}</p>
                {Array.isArray(item.customizations) && item.customizations.length > 0 && (
                  <p className="text-xs text-accent leading-tight mt-0.5 font-medium">
                    {item.customizations.map(c => c.name).join(' · ')}
                  </p>
                )}
                {item.special_instructions && (
                  <div className="text-xs font-bold text-primary bg-primary/10 rounded-md px-2 py-1 mt-1 leading-tight">
                    NOTE: {item.special_instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-4 py-2 border-t border-secondary-dark/10 flex items-center justify-between bg-secondary/50">
        <span className="text-sm font-semibold text-accent">
          {items.reduce((sum, it) => sum + (it.quantity || 1), 0)} item{items.reduce((sum, it) => sum + (it.quantity || 1), 0) !== 1 ? 's' : ''}
        </span>
        <span className="font-black text-text-dark">${order.total.toFixed(2)}</span>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-3 space-y-2">
        {isNew && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={isUpdating}
              className="flex-1 py-3.5 rounded-xl text-sm font-black transition-all disabled:opacity-50 bg-primary hover:bg-primary-light text-secondary shadow-lg shadow-primary/20 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              {isUpdating ? 'Updating...' : 'Start Making'}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              disabled={isUpdating}
              className="px-4 py-3.5 rounded-xl text-sm font-bold text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
            >
              Cancel
            </button>
          </div>
        )}

        {isPreparing && (
          <>
            <button
              onClick={() => onUpdateStatus(order.id, 'ready')}
              disabled={isUpdating}
              className="w-full py-3.5 rounded-xl text-sm font-black transition-all disabled:opacity-50 bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-700/20 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
            >
              {isUpdating ? 'Updating...' : 'Mark Ready for Pickup'}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'pending')}
              disabled={isUpdating}
              className="w-full py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-primary hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Move Back to New
            </button>
          </>
        )}

        {isReady && (
          <>
            <div className="text-center py-1.5 space-y-1">
              <span className="text-green-800 font-bold text-sm block">Waiting for customer pickup</span>
              {readySince && (
                <span className="text-xs text-stone-500 block">
                  Auto-completes in {readyMinLeft > 0 ? `${readyMinLeft} min` : 'moments'}
                </span>
              )}
            </div>
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={isUpdating}
              className="w-full py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-primary hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Move Back to Making
            </button>
          </>
        )}

        {isDone && (
          <button
            onClick={() => onUpdateStatus(order.id, 'pending')}
            disabled={isUpdating}
            className="w-full py-2 rounded-xl text-xs font-bold text-stone-600 hover:text-primary hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
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
  return Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 60000)
}

function getTimeSince(dateStr: string): string {
  const diffMin = getMinutesSince(dateStr)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin} min ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ${diffMin % 60}m ago`
  return new Date(dateStr).toLocaleDateString()
}
