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
    let done = false

    async function fetchData() {
      try {
        const [ordersRes, profilesRes] = await Promise.all([
          supabase.from('orders').select('*').order('created_at', { ascending: true }),
          supabase.from('profiles').select('id, first_name, last_name, email'),
        ])

        if (done) return

        const fetched = (ordersRes.data as Order[]) || []
        setOrders(fetched)

        // Build a lookup map: user_id → { first_name, last_name, email }
        const pMap: ProfileMap = {}
        for (const p of profilesRes.data || []) {
          pMap[p.id] = p
        }
        setProfiles(pMap)

        // Use the DB updated_at as the "ready since" timestamp so the
        // 15-min auto-complete works even after a page reload.
        for (const o of fetched) {
          if (o.status === 'ready' && !readyTimestamps.current.has(o.id)) {
            const readyAt = o.updated_at
              ? new Date(o.updated_at).getTime()
              : Date.now()
            readyTimestamps.current.set(o.id, readyAt)
          }
        }
      } catch {
        // fail silently — show empty queue
      } finally {
        done = true
        setLoading(false)
      }
    }
    fetchData()

    // Safety net: if Supabase hangs on cold start, stop loading after 8s
    const timer = setTimeout(() => {
      if (!done) { done = true; setLoading(false) }
    }, 8000)

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
      done = true
      clearTimeout(timer)
      supabase.removeChannel(channel)
    }
  }, [user, profile, supabase])

  // Tick every 1s for live wait timers
  const [, setTick] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000)
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

  // Today's scoreboard stats
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayMs = todayStart.getTime()

  const todayCompleted = orders.filter(o => {
    if (o.status !== 'completed') return false
    const ts = o.updated_at ? new Date(o.updated_at).getTime() : new Date(o.created_at).getTime()
    return ts >= todayMs
  })

  const todayDrinks = todayCompleted.reduce((sum, o) => {
    const items = Array.isArray(o.items) ? (o.items as OrderItem[]) : []
    return sum + items.reduce((s, it) => s + (it.quantity || 1), 0)
  }, 0)

  const avgFulfillMs = todayCompleted.length > 0
    ? todayCompleted.reduce((sum, o) => {
        const end = o.updated_at ? new Date(o.updated_at).getTime() : Date.now()
        return sum + (end - new Date(o.created_at).getTime())
      }, 0) / todayCompleted.length
    : 0

  const fastestMs = todayCompleted.length > 0
    ? Math.min(...todayCompleted.map(o => {
        const end = o.updated_at ? new Date(o.updated_at).getTime() : Date.now()
        return end - new Date(o.created_at).getTime()
      }))
    : 0

  return (
    <div className="h-[100dvh] bg-secondary flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="bg-primary text-secondary px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold">Order Queue</h1>
              <span className="text-secondary/50 text-sm">{activeOrders.length} active</span>
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
          {/* Scoreboard strip */}
          <div className="flex items-center gap-3 mt-1.5 overflow-x-auto">
            <div className="flex items-center gap-1.5 bg-secondary/10 rounded-full px-2.5 py-1 shrink-0">
              <span className="text-xs text-secondary/60">Today</span>
              <span className="text-sm font-black">{todayDrinks}</span>
              <span className="text-xs text-secondary/60">drinks</span>
            </div>
            {avgFulfillMs > 0 && (
              <div className="flex items-center gap-1.5 bg-secondary/10 rounded-full px-2.5 py-1 shrink-0">
                <span className="text-xs text-secondary/60">Avg</span>
                <span className="text-sm font-black">{formatDuration(avgFulfillMs)}</span>
              </div>
            )}
            {fastestMs > 0 && fastestMs < Infinity && (
              <div className="flex items-center gap-1.5 bg-secondary/10 rounded-full px-2.5 py-1 shrink-0">
                <span className="text-xs text-secondary/60">Best</span>
                <span className="text-sm font-black text-green-300">{formatDuration(fastestMs)}</span>
              </div>
            )}
            {todayCompleted.length > 0 && (
              <div className="flex items-center gap-1.5 bg-secondary/10 rounded-full px-2.5 py-1 shrink-0">
                <span className="text-xs text-secondary/60">Orders</span>
                <span className="text-sm font-black">{todayCompleted.length}</span>
              </div>
            )}
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

      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Kanban Board — horizontal scroll on mobile, 3-col grid on desktop */}
        {newOrders.length === 0 && makingOrders.length === 0 && readyOrders.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <div className="text-center py-20 bg-white rounded-2xl border border-secondary-dark/20 w-full max-w-md">
              <svg className="w-16 h-16 text-primary/20 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-accent text-lg">No active orders</p>
              <p className="text-accent/60 text-sm mt-1">New orders will appear here in real time</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory lg:snap-none lg:overflow-hidden">
            <div className="flex lg:grid lg:grid-cols-3 lg:gap-5 lg:px-6 lg:py-4 min-h-0 h-full max-w-7xl lg:mx-auto">
              {/* ─── NEW Column ─── */}
              <div className="flex-shrink-0 w-screen lg:w-auto snap-start px-4 sm:px-6 lg:px-0 pt-3 lg:pt-0 flex flex-col min-h-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-3 h-3 rounded-full bg-amber-500 shrink-0" />
                  <h2 className="font-bold text-amber-800 text-sm uppercase tracking-wider">Queue</h2>
                  <span className="bg-amber-100 text-amber-800 text-xs font-black px-2.5 py-0.5 rounded-full min-w-[1.75rem] text-center">
                    {newOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-20 scrollbar-thin">
                  {newOrders
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        customerName={getCustomerName(order)}
                        onUpdateStatus={updateStatus}
                        isUpdating={updatingIds.has(order.id)}
                      />
                    ))}
                  {newOrders.length === 0 && (
                    <div className="text-center py-12 text-accent/40">
                      <p className="text-sm font-medium">Queue is clear</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── MAKING Column ─── */}
              <div className="flex-shrink-0 w-screen lg:w-auto snap-start px-4 sm:px-6 lg:px-0 pt-3 lg:pt-0 flex flex-col min-h-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-3 h-3 rounded-full bg-sky-500 shrink-0 animate-pulse" />
                  <h2 className="font-bold text-sky-800 text-sm uppercase tracking-wider">Making</h2>
                  <span className="bg-sky-100 text-sky-800 text-xs font-black px-2.5 py-0.5 rounded-full min-w-[1.75rem] text-center">
                    {makingOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-20 scrollbar-thin">
                  {makingOrders
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
                    .map(order => (
                      <OrderCard
                        key={order.id}
                        order={order}
                        customerName={getCustomerName(order)}
                        onUpdateStatus={updateStatus}
                        isUpdating={updatingIds.has(order.id)}
                      />
                    ))}
                  {makingOrders.length === 0 && (
                    <div className="text-center py-12 text-accent/40">
                      <p className="text-sm font-medium">Nothing in progress</p>
                      <p className="text-xs mt-1">Tap &quot;Start Making&quot; on a queued order</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── READY Column ─── */}
              <div className="flex-shrink-0 w-screen lg:w-auto snap-start px-4 sm:px-6 lg:px-0 pt-3 lg:pt-0 flex flex-col min-h-0">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-3 h-3 rounded-full bg-green-500 shrink-0" />
                  <h2 className="font-bold text-green-800 text-sm uppercase tracking-wider">Ready</h2>
                  <span className="bg-green-100 text-green-800 text-xs font-black px-2.5 py-0.5 rounded-full min-w-[1.75rem] text-center">
                    {readyOrders.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pb-20 scrollbar-thin">
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
                  {readyOrders.length === 0 && (
                    <div className="text-center py-12 text-accent/40">
                      <p className="text-sm font-medium">No pickups waiting</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Completed orders toggle */}
        {completedOrders.length > 0 && (
          <div className="border-t border-secondary-dark/20 px-4 sm:px-6 py-3 bg-secondary/80 max-w-7xl mx-auto w-full">
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
  const isNew = order.status === 'pending' || order.status === 'confirmed'
  const isPreparing = order.status === 'preparing'
  const isReady = order.status === 'ready'
  const isDone = order.status === 'completed' || order.status === 'cancelled'
  const isUrgent = isNew && getMinutesSince(order.created_at) >= 5

  // Live wait timer
  const waitMs = Date.now() - new Date(order.created_at).getTime()
  const waitTimer = formatWaitTimer(waitMs)

  let readyMinLeft = 0
  if (isReady && readySince) {
    const elapsed = Math.floor((Date.now() - readySince) / 60000)
    readyMinLeft = Math.max(0, READY_TIMEOUT_MINUTES - elapsed)
  }

  return (
    <div className={`rounded-xl ${isUrgent ? 'border-[3px] border-red-600' : `border-2 ${config.border}`} ${config.bg} overflow-hidden transition-all shadow-sm hover:shadow-md ${isUpdating ? 'opacity-60 scale-[0.98]' : ''}`}>
      {/* Header with live timer */}
      <div className={`${config.headerBg} ${config.headerText} px-3 py-2`}>
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-widest opacity-80">{config.label}</span>
          {!isDone && (
            <span className={`font-mono text-xs font-black px-1.5 py-0.5 rounded ${
              isUrgent
                ? 'bg-red-500 text-white'
                : isNew
                  ? 'bg-white/20 text-white'
                  : isPreparing
                    ? 'bg-white/20 text-white'
                    : 'bg-white/20 text-white'
            }`}>
              {waitTimer}
            </span>
          )}
        </div>
        <p className="text-base font-black mt-0.5 leading-tight truncate">{customerName}</p>
        {isUrgent && (
          <span className="inline-block text-[10px] font-black text-red-100 bg-red-500/60 px-1.5 py-0.5 rounded mt-1 uppercase tracking-wider">Urgent</span>
        )}
      </div>

      {/* Items */}
      <div className="px-3 py-2.5">
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="bg-primary text-secondary text-xs font-black w-5.5 h-5.5 rounded flex items-center justify-center shrink-0 mt-0.5" style={{ width: '1.375rem', height: '1.375rem' }}>
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
                  <div className="text-xs font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5 mt-1 leading-tight">
                    NOTE: {item.special_instructions}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Total */}
      <div className="px-3 py-1.5 border-t border-secondary-dark/10 flex items-center justify-between bg-stone-100">
        <span className="text-sm font-semibold text-accent">
          {items.reduce((sum, it) => sum + (it.quantity || 1), 0)} item{items.reduce((sum, it) => sum + (it.quantity || 1), 0) !== 1 ? 's' : ''}
        </span>
        <span className="font-black text-text-dark">${order.total.toFixed(2)}</span>
      </div>

      {/* Actions */}
      <div className="px-3 pb-3 pt-2.5 space-y-1.5">
        {isNew && (
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={isUpdating}
              className="flex-1 py-3 rounded-lg text-sm font-black transition-all disabled:opacity-50 bg-primary hover:bg-primary-light text-secondary shadow-lg shadow-primary/20 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
            >
              {isUpdating ? 'Updating...' : 'Start Making'}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'cancelled')}
              disabled={isUpdating}
              className="px-3 py-3 rounded-lg text-sm font-bold text-red-700 bg-red-50 border border-red-300 hover:bg-red-100 transition-colors disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600"
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
              className="w-full py-3 rounded-lg text-sm font-black transition-all disabled:opacity-50 bg-green-700 hover:bg-green-800 text-white shadow-lg shadow-green-700/20 active:scale-[0.97] outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-600"
            >
              {isUpdating ? 'Updating...' : 'Mark Ready for Pickup'}
            </button>
            <button
              onClick={() => onUpdateStatus(order.id, 'pending')}
              disabled={isUpdating}
              className="w-full py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:text-primary hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
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
            <div className="text-center py-1 space-y-0.5">
              <span className="text-green-800 font-bold text-sm block">Waiting for pickup</span>
              {readySince && (
                <span className="text-xs text-stone-500 block">
                  Auto-completes in {readyMinLeft > 0 ? `${readyMinLeft} min` : 'moments'}
                </span>
              )}
            </div>
            <button
              onClick={() => onUpdateStatus(order.id, 'preparing')}
              disabled={isUpdating}
              className="w-full py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:text-primary hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
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
            className="w-full py-1.5 rounded-lg text-xs font-bold text-stone-600 hover:text-primary hover:bg-stone-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-400"
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

/** Live mm:ss counter for active order cards */
function formatWaitTimer(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/** Format duration in ms to compact display (e.g., "3:45" or "1h 12m") */
function formatDuration(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 60) {
    const sec = Math.floor((ms % 60000) / 1000)
    return `${totalMin}:${String(sec).padStart(2, '0')}`
  }
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  return `${h}h ${m}m`
}
