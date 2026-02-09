'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { Order, OrderItem, OrderStatus } from '@/lib/types/database'

type DateRange = 'today' | 'week' | 'month' | 'all'

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function getRangeStart(range: DateRange): Date | null {
  const now = new Date()
  if (range === 'today') return startOfDay(now)
  if (range === 'week') {
    const d = startOfDay(now)
    d.setDate(d.getDate() - d.getDay())
    return d
  }
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1)
  return null
}

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState<DateRange>('today')
  const { profile } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('orders')
          .select('*')
          .order('created_at', { ascending: false })
        setOrders((data as Order[]) || [])
      } catch {
        // silently handle fetch error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  const rangeStart = getRangeStart(range)
  const filtered = useMemo(() => {
    if (!rangeStart) return orders
    return orders.filter(o => new Date(o.created_at) >= rangeStart)
  }, [orders, rangeStart])

  // Completed orders only for revenue calculations
  const completed = useMemo(() => filtered.filter(o => o.status === 'completed'), [filtered])
  const cancelled = useMemo(() => filtered.filter(o => o.status === 'cancelled'), [filtered])

  // --- Metrics ---
  const totalRevenue = completed.reduce((s, o) => s + o.total, 0)
  const avgOrderValue = completed.length > 0 ? totalRevenue / completed.length : 0
  const uniqueCustomers = new Set(filtered.map(o => o.user_id)).size
  const starsAwarded = completed.reduce((s, o) => s + (o.stars_earned || 0), 0)

  // --- Status breakdown ---
  const statusCounts: Record<string, number> = {}
  for (const o of filtered) {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1
  }

  // --- Top items ---
  const itemMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const o of completed) {
    const items = Array.isArray(o.items) ? (o.items as OrderItem[]) : []
    for (const it of items) {
      const key = it.menu_item_name
      const prev = itemMap.get(key) || { name: key, qty: 0, revenue: 0 }
      prev.qty += it.quantity || 1
      prev.revenue += it.item_total || 0
      itemMap.set(key, prev)
    }
  }
  const topItems = [...itemMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 10)
  const maxQty = topItems.length > 0 ? topItems[0].qty : 1

  // --- Daily revenue (last 7 days or range) ---
  const dailyMap = new Map<string, { revenue: number; orders: number }>()
  for (const o of completed) {
    const day = new Date(o.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const prev = dailyMap.get(day) || { revenue: 0, orders: 0 }
    prev.revenue += o.total
    prev.orders += 1
    dailyMap.set(day, prev)
  }
  const dailyData = [...dailyMap.entries()].reverse().slice(0, 14).reverse()
  const maxDailyRevenue = dailyData.length > 0 ? Math.max(...dailyData.map(d => d[1].revenue)) : 1

  // --- Busiest hours ---
  const hourCounts = new Array(24).fill(0)
  for (const o of filtered) {
    const h = new Date(o.created_at).getHours()
    hourCounts[h]++
  }
  const maxHourCount = Math.max(...hourCounts, 1)

  if (profile?.role !== 'admin') {
    return <div className="text-accent">Only admins can view reports.</div>
  }

  if (loading) {
    return <div className="text-accent">Loading reports...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-primary">Reports</h1>
        <div className="flex gap-1.5 bg-white rounded-lg border border-secondary-dark/20 p-1">
          {([['today', 'Today'], ['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']] as [DateRange, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setRange(key)}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                range === key ? 'bg-primary text-secondary' : 'text-accent hover:bg-primary/5'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Revenue"
          value={`$${totalRevenue.toFixed(2)}`}
          sub={`${completed.length} completed order${completed.length !== 1 ? 's' : ''}`}
          color="text-green-700"
          bg="bg-green-50"
          border="border-green-200"
        />
        <StatCard
          label="Avg Order Value"
          value={`$${avgOrderValue.toFixed(2)}`}
          sub={`${filtered.length} total order${filtered.length !== 1 ? 's' : ''}`}
          color="text-sky-700"
          bg="bg-sky-50"
          border="border-sky-200"
        />
        <StatCard
          label="Customers"
          value={String(uniqueCustomers)}
          sub={`${starsAwarded} stars awarded`}
          color="text-amber-700"
          bg="bg-amber-50"
          border="border-amber-200"
        />
        <StatCard
          label="Cancelled"
          value={String(cancelled.length)}
          sub={cancelled.length > 0 && filtered.length > 0
            ? `${((cancelled.length / filtered.length) * 100).toFixed(1)}% cancel rate`
            : 'No cancellations'}
          color="text-red-700"
          bg="bg-red-50"
          border="border-red-200"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Order Status Breakdown */}
        <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Order Status Breakdown</h2>
          <div className="space-y-3">
            {(['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'] as OrderStatus[]).map(status => {
              const count = statusCounts[status] || 0
              const pct = filtered.length > 0 ? (count / filtered.length) * 100 : 0
              return (
                <div key={status} className="flex items-center gap-3">
                  <span className="w-20 text-xs font-bold text-accent uppercase tracking-wider">{status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getStatusBarColor(status)}`}
                      style={{ width: `${Math.max(pct, count > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                  <span className="w-10 text-right text-sm font-bold text-text-dark">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Daily Revenue */}
        <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Daily Revenue</h2>
          {dailyData.length === 0 ? (
            <p className="text-accent text-sm py-8 text-center">No completed orders in this period</p>
          ) : (
            <div className="space-y-2">
              {dailyData.map(([day, data]) => (
                <div key={day} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-medium text-accent shrink-0">{day}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all flex items-center justify-end pr-2"
                      style={{ width: `${Math.max((data.revenue / maxDailyRevenue) * 100, 8)}%` }}
                    >
                      <span className="text-[10px] font-bold text-white whitespace-nowrap">
                        ${data.revenue.toFixed(0)}
                      </span>
                    </div>
                  </div>
                  <span className="w-8 text-right text-xs text-accent">{data.orders}</span>
                </div>
              ))}
              <p className="text-[10px] text-accent/50 text-right mt-1">orders shown on right</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Top Selling Items</h2>
          {topItems.length === 0 ? (
            <p className="text-accent text-sm py-8 text-center">No sales data yet</p>
          ) : (
            <div className="space-y-2.5">
              {topItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                    i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-gray-200 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-medium text-text-dark truncate">{item.name}</span>
                      <span className="text-xs text-accent shrink-0">${item.revenue.toFixed(2)}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${(item.qty / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-accent w-8 text-right">{item.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Busiest Hours */}
        <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
          <h2 className="text-lg font-semibold text-primary mb-4">Busiest Hours</h2>
          {filtered.length === 0 ? (
            <p className="text-accent text-sm py-8 text-center">No order data yet</p>
          ) : (
            <div className="flex items-end gap-1 h-40">
              {hourCounts.map((count, h) => {
                const pct = (count / maxHourCount) * 100
                const isBusinessHour = h >= 6 && h <= 20
                if (!isBusinessHour && count === 0) return null
                return (
                  <div key={h} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="w-full flex flex-col items-center justify-end" style={{ height: '120px' }}>
                      <div
                        className={`w-full max-w-[28px] rounded-t transition-all ${
                          count > 0 ? 'bg-sky-500' : 'bg-gray-200'
                        }`}
                        style={{ height: `${Math.max(pct, count > 0 ? 4 : 1)}%` }}
                        title={`${formatHour(h)}: ${count} orders`}
                      />
                    </div>
                    <span className="text-[9px] text-accent leading-none">{formatHourShort(h)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, sub, color, bg, border }: {
  label: string; value: string; sub: string; color: string; bg: string; border: string
}) {
  return (
    <div className={`rounded-xl border-2 ${border} ${bg} p-4`}>
      <p className="text-xs font-bold text-accent uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-2xl sm:text-3xl font-black ${color}`}>{value}</p>
      <p className="text-xs text-accent mt-1">{sub}</p>
    </div>
  )
}

function getStatusBarColor(status: OrderStatus): string {
  switch (status) {
    case 'pending': return 'bg-amber-400'
    case 'confirmed': return 'bg-blue-400'
    case 'preparing': return 'bg-sky-500'
    case 'ready': return 'bg-green-500'
    case 'completed': return 'bg-gray-400'
    case 'cancelled': return 'bg-red-400'
    default: return 'bg-gray-300'
  }
}

function formatHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function formatHourShort(h: number): string {
  if (h === 0) return '12a'
  if (h < 12) return `${h}a`
  if (h === 12) return '12p'
  return `${h - 12}p`
}
