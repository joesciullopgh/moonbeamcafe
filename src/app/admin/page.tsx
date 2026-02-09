'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ menuItems: 0, orders: 0, users: 0 })
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const [menuRes, ordersRes, usersRes] = await Promise.all([
          supabase.from('menu_items').select('id', { count: 'exact', head: true }),
          supabase.from('orders').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ])
        setStats({
          menuItems: menuRes.count || 0,
          orders: ordersRes.count || 0,
          users: usersRes.count || 0,
        })
      } catch {
        // silently handle fetch error
      }
    }
    fetchStats()
  }, [supabase])

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Menu Items" value={stats.menuItems} />
        <StatCard title="Total Orders" value={stats.orders} />
        <StatCard title="Registered Users" value={stats.users} />
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-xl border border-secondary-dark/20 p-6">
      <p className="text-sm text-accent">{title}</p>
      <p className="text-3xl font-bold text-primary mt-1">{value}</p>
    </div>
  )
}
