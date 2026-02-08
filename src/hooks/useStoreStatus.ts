'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getStoreStatus,
  DEFAULT_TIMEZONE,
  DEFAULT_CUTOFF_MINUTES,
  DEFAULT_SCHEDULE,
} from '@/lib/store-hours'
import type { DaySchedule, StoreOverride, StoreStatus } from '@/lib/store-hours'

interface OverrideRow extends StoreOverride {
  id: string
}

interface UseStoreStatusReturn {
  status: StoreStatus | null
  loading: boolean
  override: OverrideRow | null
  toggleForcedClosed: (reason?: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useStoreStatus(): UseStoreStatusReturn {
  const [status, setStatus] = useState<StoreStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [override, setOverride] = useState<OverrideRow | null>(null)
  const [timezone, setTimezone] = useState(DEFAULT_TIMEZONE)
  const [cutoffMinutes, setCutoffMinutes] = useState(DEFAULT_CUTOFF_MINUTES)
  const supabase = useMemo(() => createClient(), [])

  const fetchAll = useCallback(async () => {
    const [hoursRes, overrideRes, settingsRes] = await Promise.all([
      supabase.from('store_hours').select('*').order('day_of_week'),
      supabase.from('store_override').select('*').limit(1).single(),
      supabase.from('store_settings').select('key, value'),
    ])

    const sched: DaySchedule[] = hoursRes.data?.length ? hoursRes.data : DEFAULT_SCHEDULE
    const ovr: OverrideRow | null = overrideRes.data || null
    let tz = DEFAULT_TIMEZONE
    let cutoff = DEFAULT_CUTOFF_MINUTES

    if (settingsRes.data) {
      for (const row of settingsRes.data) {
        if (row.key === 'timezone') tz = row.value
        if (row.key === 'last_order_cutoff_minutes') cutoff = Number(row.value)
      }
    }

    setSchedule(sched)
    setOverride(ovr)
    setTimezone(tz)
    setCutoffMinutes(cutoff)

    const s = getStoreStatus(sched, ovr, tz, cutoff)
    setStatus(s)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // Re-evaluate store status every 60 seconds
  useEffect(() => {
    if (loading) return
    const interval = setInterval(() => {
      const s = getStoreStatus(schedule, override, timezone, cutoffMinutes)
      setStatus(s)
    }, 60000)
    return () => clearInterval(interval)
  }, [schedule, override, timezone, cutoffMinutes, loading])

  const toggleForcedClosed = useCallback(async (reason?: string) => {
    if (!override) return
    const newValue = !override.is_forced_closed
    await supabase
      .from('store_override')
      .update({
        is_forced_closed: newValue,
        reason: newValue ? (reason || 'other') : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', override.id)

    await fetchAll()
  }, [override, supabase, fetchAll])

  return { status, loading, override, toggleForcedClosed, refetch: fetchAll }
}
