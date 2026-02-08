'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import {
  DAY_NAMES,
  DEFAULT_SCHEDULE,
  validateDayRanges,
  formatTime,
} from '@/lib/store-hours'
import type { DaySchedule } from '@/lib/store-hours'

// Monday-first display order for business UX
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0]

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
]

export default function AdminHoursPage() {
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE)
  const [timezone, setTimezone] = useState('America/New_York')
  const [cutoffMinutes, setCutoffMinutes] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<Record<number, string>>({})
  const { profile } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      const [hoursRes, settingsRes] = await Promise.all([
        supabase.from('store_hours').select('*').order('day_of_week'),
        supabase.from('store_settings').select('key, value'),
      ])

      if (hoursRes.data && hoursRes.data.length > 0) {
        setSchedule(hoursRes.data)
      }

      if (settingsRes.data) {
        for (const row of settingsRes.data) {
          if (row.key === 'timezone') setTimezone(row.value)
          if (row.key === 'last_order_cutoff_minutes') setCutoffMinutes(Number(row.value))
        }
      }

      setLoading(false)
    }
    load()
  }, [supabase])

  function toggleDayClosed(dayIndex: number) {
    setSchedule(prev => prev.map(d =>
      d.day_of_week === dayIndex
        ? { ...d, is_closed: !d.is_closed }
        : d
    ))
    setErrors(prev => {
      const next = { ...prev }
      delete next[dayIndex]
      return next
    })
  }

  function updateRange(dayIndex: number, rangeIndex: number, field: 'open' | 'close', value: string) {
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIndex) return d
      const newRanges = [...d.ranges]
      newRanges[rangeIndex] = { ...newRanges[rangeIndex], [field]: value }
      return { ...d, ranges: newRanges }
    }))
  }

  function addRange(dayIndex: number) {
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIndex || d.ranges.length >= 2) return d
      return { ...d, ranges: [...d.ranges, { open: '12:00', close: '17:00' }] }
    }))
  }

  function removeRange(dayIndex: number, rangeIndex: number) {
    setSchedule(prev => prev.map(d => {
      if (d.day_of_week !== dayIndex) return d
      return { ...d, ranges: d.ranges.filter((_, i) => i !== rangeIndex) }
    }))
  }

  async function handleSave() {
    const newErrors: Record<number, string> = {}
    for (const day of schedule) {
      if (!day.is_closed && day.ranges.length > 0) {
        const err = validateDayRanges(day.ranges)
        if (err) newErrors[day.day_of_week] = err
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setMessage('')
      return
    }
    setErrors({})
    setSaving(true)
    setMessage('')

    for (const day of schedule) {
      const { error } = await supabase
        .from('store_hours')
        .upsert(
          {
            day_of_week: day.day_of_week,
            is_closed: day.is_closed,
            ranges: day.ranges,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'day_of_week' }
        )

      if (error) {
        setMessage(`Error saving ${DAY_NAMES[day.day_of_week]}: ${error.message}`)
        setSaving(false)
        return
      }
    }

    // Save timezone and cutoff settings
    for (const [key, value] of [
      ['timezone', timezone],
      ['last_order_cutoff_minutes', String(cutoffMinutes)],
    ]) {
      const { error } = await supabase
        .from('store_settings')
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )
      if (error) {
        setMessage(`Error saving ${key}: ${error.message}`)
        setSaving(false)
        return
      }
    }

    setMessage('Store hours saved successfully!')
    setSaving(false)
  }

  if (profile?.role !== 'admin') {
    return <div className="text-accent">Only admins can manage store hours.</div>
  }

  if (loading) {
    return <div className="text-accent">Loading store hours...</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-2">Store Hours</h1>
      <p className="text-accent text-sm mb-8">
        Set your weekly schedule. Customers can only place orders during open hours.
      </p>

      {message && (
        <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${
          message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Weekly Schedule */}
      <div className="space-y-3 mb-8">
        {DISPLAY_ORDER.map(dayIndex => {
          const day = schedule.find(d => d.day_of_week === dayIndex)
          if (!day) return null
          const dayError = errors[dayIndex]

          return (
            <div
              key={dayIndex}
              className={`bg-white rounded-xl border p-4 ${
                dayError ? 'border-red-300' : 'border-secondary-dark/20'
              }`}
            >
              {/* Day header row */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Day name */}
                <div className="w-24 shrink-0">
                  <span className="font-bold text-primary text-sm">{DAY_NAMES[dayIndex]}</span>
                </div>

                {/* Open/Closed toggle */}
                <button
                  type="button"
                  onClick={() => toggleDayClosed(dayIndex)}
                  className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    !day.is_closed ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      !day.is_closed ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                <span className={`text-xs font-bold uppercase tracking-wider w-12 ${
                  !day.is_closed ? 'text-green-700' : 'text-gray-400'
                }`}>
                  {day.is_closed ? 'Closed' : 'Open'}
                </span>

                {/* Summary when closed */}
                {day.is_closed && (
                  <span className="text-xs text-gray-400 italic">No orders accepted</span>
                )}
              </div>

              {/* Time ranges (visible when open) */}
              {!day.is_closed && (
                <div className="mt-3 ml-0 sm:ml-[calc(6rem+3.75rem+0.75rem)] space-y-2">
                  {day.ranges.map((range, ri) => (
                    <div key={ri} className="flex items-center gap-2 flex-wrap">
                      {ri > 0 && (
                        <span className="text-xs text-accent font-semibold w-full sm:w-auto">+ Split shift</span>
                      )}
                      <label className="text-xs text-accent">Open</label>
                      <input
                        type="time"
                        value={range.open}
                        onChange={e => updateRange(dayIndex, ri, 'open', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                      <label className="text-xs text-accent">Close</label>
                      <input
                        type="time"
                        value={range.close}
                        onChange={e => updateRange(dayIndex, ri, 'close', e.target.value)}
                        className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                      />
                      {ri > 0 && (
                        <button
                          type="button"
                          onClick={() => removeRange(dayIndex, ri)}
                          className="text-red-500 hover:text-red-700 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-red-400 rounded px-2 py-1"
                        >
                          Remove
                        </button>
                      )}
                      {ri === 0 && (
                        <span className="text-xs text-gray-400 hidden sm:inline">
                          {formatTime(range.open)} – {formatTime(range.close)}
                        </span>
                      )}
                    </div>
                  ))}
                  {day.ranges.length < 2 && (
                    <button
                      type="button"
                      onClick={() => addRange(dayIndex)}
                      className="text-xs text-primary font-bold hover:underline outline-none focus-visible:ring-2 focus-visible:ring-primary rounded px-1 py-0.5"
                    >
                      + Add split hours
                    </button>
                  )}
                </div>
              )}

              {dayError && (
                <p className="text-xs text-red-600 mt-2">{dayError}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Order Settings */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 p-6 mb-8">
        <h2 className="text-lg font-semibold text-primary mb-4">Order Settings</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">
              Store Timezone
            </label>
            <select
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            >
              {TIMEZONES.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">
              Last Order Cutoff
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={120}
                value={cutoffMinutes}
                onChange={e => setCutoffMinutes(Number(e.target.value))}
                className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
              />
              <span className="text-sm text-accent">minutes before close</span>
            </div>
            <p className="text-xs text-accent mt-1.5">
              {cutoffMinutes > 0
                ? `Orders blocked ${cutoffMinutes} min before closing.`
                : 'Orders accepted right up to closing time.'}
            </p>
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-primary text-secondary px-8 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Store Hours'}
      </button>
    </div>
  )
}
