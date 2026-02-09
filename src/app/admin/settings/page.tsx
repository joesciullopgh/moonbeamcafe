'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import { useStoreSettings } from '@/stores/store-settings'

interface SettingField {
  key: string
  label: string
  placeholder: string
  type: 'text' | 'url' | 'tel' | 'textarea'
  group: string
  hint?: string
}

const SETTING_FIELDS: SettingField[] = [
  { key: 'store_name', label: 'Store Name', placeholder: 'Moonbeam Cafe', type: 'text', group: 'General' },
  { key: 'tagline', label: 'Tagline', placeholder: 'Your neighborhood coffee shop...', type: 'text', group: 'General' },
  { key: 'address_line1', label: 'Address Line 1', placeholder: '4621 Liberty Avenue', type: 'text', group: 'Location & Contact' },
  { key: 'address_line2', label: 'Address Line 2', placeholder: 'Pittsburgh, PA', type: 'text', group: 'Location & Contact' },
  { key: 'phone', label: 'Phone Number', placeholder: '(412) 251-1392', type: 'tel', group: 'Location & Contact' },
  { key: 'hours_weekday', label: 'Weekday Hours (display text)', placeholder: 'Mon–Sat: 7am – 5pm', type: 'text', group: 'Display Hours' },
  { key: 'hours_weekend', label: 'Weekend Hours (display text)', placeholder: 'Sunday: 9am – 3pm', type: 'text', group: 'Display Hours' },
  { key: 'story_title', label: 'Title', placeholder: 'More Than Just Coffee', type: 'text', group: 'Our Story' },
  { key: 'story_body', label: 'Body', placeholder: 'Tell your story...', type: 'textarea', group: 'Our Story', hint: 'Separate paragraphs with a blank line.' },
  { key: 'instagram_url', label: 'Instagram URL', placeholder: 'https://instagram.com/...', type: 'url', group: 'Social Media' },
  { key: 'facebook_url', label: 'Facebook URL', placeholder: 'https://facebook.com/...', type: 'url', group: 'Social Media' },
]

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const { profile } = useAuthStore()
  const { fetchSettings } = useStoreSettings()
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    async function load() {
      try {
        const { data } = await supabase
          .from('store_settings')
          .select('key, value')

        const vals: Record<string, string> = {}
        if (data) {
          for (const row of data) {
            vals[row.key] = row.value
          }
        }
        // Fill in defaults for missing keys
        for (const field of SETTING_FIELDS) {
          if (!(field.key in vals)) {
            vals[field.key] = ''
          }
        }
        setValues(vals)
      } catch {
        // silently handle fetch error
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [supabase])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    let hasError = false
    for (const field of SETTING_FIELDS) {
      const value = values[field.key] || ''

      // Upsert each setting
      const { error } = await supabase
        .from('store_settings')
        .upsert(
          { key: field.key, value, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        )

      if (error) {
        setMessage(`Error saving ${field.label}: ${error.message}`)
        hasError = true
        break
      }
    }

    if (!hasError) {
      setMessage('Settings saved successfully!')
      // Refresh the global store settings
      await fetchSettings()
    }
    setSaving(false)
  }

  if (profile?.role !== 'admin') {
    return <div className="text-accent">Only admins can manage store settings.</div>
  }

  if (loading) {
    return <div className="text-accent">Loading settings...</div>
  }

  const groups = [...new Set(SETTING_FIELDS.map(f => f.group))]

  return (
    <div>
      <h1 className="text-3xl font-bold text-primary mb-6">Store Settings</h1>
      <p className="text-accent text-sm mb-8">
        Update your store information below. Changes will appear on the website immediately after saving.
      </p>

      <form onSubmit={handleSave}>
        {message && (
          <div className={`px-4 py-3 rounded-lg text-sm mb-6 ${
            message.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-8">
          {groups.map(group => (
            <div key={group} className="bg-white rounded-xl border border-secondary-dark/20 p-6">
              <h2 className="text-lg font-semibold text-primary mb-4">{group}</h2>
              {group === 'Display Hours' && (
                <div className="bg-primary/5 rounded-lg px-4 py-3 mb-4 text-sm">
                  <p className="text-accent">
                    These are display-only text shown in the footer. To manage the actual store schedule
                    (open/close times, order blocking), go to{' '}
                    <Link href="/admin/hours" className="text-primary font-bold hover:underline">
                      Store Hours
                    </Link>.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {SETTING_FIELDS.filter(f => f.group === group).map(field => (
                  <div key={field.key}>
                    <label htmlFor={field.key} className="block text-sm font-medium text-text-dark mb-1">
                      {field.label}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.key}
                        rows={6}
                        value={values[field.key] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                      />
                    ) : (
                      <input
                        id={field.key}
                        type={field.type}
                        value={values[field.key] || ''}
                        onChange={e => setValues(prev => ({ ...prev, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                      />
                    )}
                    {field.hint && (
                      <p className="text-xs text-accent mt-1">{field.hint}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-secondary px-8 py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save All Settings'}
          </button>
        </div>
      </form>
    </div>
  )
}
