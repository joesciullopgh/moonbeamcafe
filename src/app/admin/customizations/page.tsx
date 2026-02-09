'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/auth-store'
import type { CustomizationOption } from '@/lib/types/database'

const CUSTOMIZATION_TYPES = ['size', 'milk', 'shots', 'sweetness', 'temperature', 'extras'] as const
type CustomizationType = typeof CUSTOMIZATION_TYPES[number]

export default function AdminCustomizationsPage() {
  const [options, setOptions] = useState<CustomizationOption[]>([])
  const [loading, setLoading] = useState(true)
  const [activeType, setActiveType] = useState<CustomizationType>('size')
  const [showForm, setShowForm] = useState(false)
  const [editingOption, setEditingOption] = useState<CustomizationOption | null>(null)
  const { profile } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  async function fetchOptions() {
    try {
      const { data } = await supabase
        .from('customization_options')
        .select('*')
        .order('type')
        .order('price_modifier')
        .order('name')
      setOptions(data || [])
    } catch {
      // silently handle fetch error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOptions()
  }, [supabase])

  async function toggleAvailability(option: CustomizationOption) {
    const { error } = await supabase
      .from('customization_options')
      .update({ is_available: !option.is_available })
      .eq('id', option.id)

    if (!error) {
      setOptions(prev =>
        prev.map(o => o.id === option.id ? { ...o, is_available: !o.is_available } : o)
      )
    }
  }

  async function deleteOption(id: string) {
    if (!confirm('Delete this customization option?')) return
    const { error } = await supabase.from('customization_options').delete().eq('id', id)
    if (!error) {
      setOptions(prev => prev.filter(o => o.id !== id))
    }
  }

  if (profile?.role !== 'admin') {
    return <div className="text-accent">Only admins can manage customization options.</div>
  }

  if (loading) {
    return <div className="text-accent">Loading customizations...</div>
  }

  const filteredOptions = options.filter(o => o.type === activeType)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Customization Options</h1>
        <button
          onClick={() => { setEditingOption(null); setShowForm(true) }}
          className="bg-primary text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
        >
          + Add Option
        </button>
      </div>

      {/* Type Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-4 mb-6">
        {CUSTOMIZATION_TYPES.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors capitalize ${
              activeType === type
                ? 'bg-primary text-secondary'
                : 'bg-secondary text-primary hover:bg-secondary-dark'
            }`}
          >
            {type} ({options.filter(o => o.type === type).length})
          </button>
        ))}
      </div>

      {showForm && (
        <CustomizationForm
          option={editingOption}
          defaultType={activeType}
          onSave={async () => {
            setShowForm(false)
            setEditingOption(null)
            await fetchOptions()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingOption(null)
          }}
        />
      )}

      {/* Options Table */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-primary">Name</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Type</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Price Modifier</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Status</th>
                <th className="text-right px-4 py-3 font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark/10">
              {filteredOptions.map(option => (
                <tr key={option.id} className="hover:bg-primary/5">
                  <td className="px-4 py-3 font-medium text-text-dark">{option.name}</td>
                  <td className="px-4 py-3 text-accent capitalize">{option.type}</td>
                  <td className="px-4 py-3 text-accent">
                    {option.price_modifier > 0
                      ? `+$${option.price_modifier.toFixed(2)}`
                      : 'Free'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability(option)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        option.is_available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {option.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditingOption(option); setShowForm(true) }}
                        className="text-primary hover:text-primary-light text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteOption(option.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredOptions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-accent">
                    No {activeType} options yet. Click &quot;+ Add Option&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CustomizationForm({
  option,
  defaultType,
  onSave,
  onCancel,
}: {
  option: CustomizationOption | null
  defaultType: CustomizationType
  onSave: () => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(option?.name || '')
  const [type, setType] = useState<string>(option?.type || defaultType)
  const [priceModifier, setPriceModifier] = useState(option?.price_modifier?.toString() || '0')
  const [isAvailable, setIsAvailable] = useState(option?.is_available ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const data = {
      name,
      type,
      price_modifier: parseFloat(priceModifier) || 0,
      is_available: isAvailable,
    }

    let result
    if (option) {
      result = await supabase.from('customization_options').update(data).eq('id', option.id)
    } else {
      result = await supabase.from('customization_options').insert(data)
    }

    if (result.error) {
      setError(result.error.message)
      setSaving(false)
    } else {
      await onSave()
    }
  }

  return (
    <div className="bg-white rounded-xl border border-secondary-dark/20 p-6 mb-6">
      <h2 className="text-xl font-bold text-primary mb-4">
        {option ? 'Edit Option' : 'New Customization Option'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Name</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Extra Large"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            >
              {CUSTOMIZATION_TYPES.map(t => (
                <option key={t} value={t} className="capitalize">{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Price Modifier ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={priceModifier}
              onChange={e => setPriceModifier(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isAvailable}
              onChange={e => setIsAvailable(e.target.checked)}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <span className="text-sm text-text-dark">Available</span>
          </label>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-secondary px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : (option ? 'Update' : 'Add Option')}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
