'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/menu-data'
import type { MenuItem } from '@/lib/types/database'
import { useAuthStore } from '@/stores/auth-store'

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [seeding, setSeeding] = useState(false)
  const { profile } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  async function fetchMenu() {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name')
    setMenuItems(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchMenu()
  }, [])

  async function seedMenu() {
    setSeeding(true)
    const items = MENU_ITEMS.map(item => ({
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      customizable: item.customizable,
      is_available: true,
    }))

    const { error } = await supabase.from('menu_items').insert(items)
    if (error) {
      alert('Error seeding menu: ' + error.message)
    } else {
      await fetchMenu()
    }
    setSeeding(false)
  }

  async function toggleAvailability(item: MenuItem) {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: !item.is_available })
      .eq('id', item.id)

    if (!error) {
      setMenuItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i)
      )
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (!error) {
      setMenuItems(prev => prev.filter(i => i.id !== id))
    }
  }

  if (profile?.role !== 'admin') {
    return <div className="text-accent">Only admins can manage the menu.</div>
  }

  if (loading) {
    return <div className="text-accent">Loading menu...</div>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-primary">Menu Management</h1>
        <div className="flex gap-3">
          {menuItems.length === 0 && (
            <button
              onClick={seedMenu}
              disabled={seeding}
              className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding...' : 'Seed Default Menu'}
            </button>
          )}
          <button
            onClick={() => { setEditingItem(null); setShowForm(true) }}
            className="bg-primary text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
          >
            + Add Item
          </button>
        </div>
      </div>

      {showForm && (
        <MenuItemForm
          item={editingItem}
          onSave={async () => {
            setShowForm(false)
            setEditingItem(null)
            await fetchMenu()
          }}
          onCancel={() => {
            setShowForm(false)
            setEditingItem(null)
          }}
        />
      )}

      {/* Menu items table */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-primary">Name</th>
                <th className="text-left px-4 py-3 font-medium text-primary hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Price</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Status</th>
                <th className="text-right px-4 py-3 font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark/10">
              {menuItems.map(item => (
                <tr key={item.id} className="hover:bg-primary/5">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-dark">{item.name}</p>
                      <p className="text-xs text-accent mt-0.5 hidden sm:block">{item.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-accent hidden md:table-cell">{item.category}</td>
                  <td className="px-4 py-3 text-accent">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleAvailability(item)}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.is_available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {item.is_available ? 'Available' : 'Unavailable'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => { setEditingItem(item); setShowForm(true) }}
                        className="text-primary hover:text-primary-light text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="text-red-600 hover:text-red-700 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {menuItems.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-accent">
                    No menu items yet. Click &quot;Seed Default Menu&quot; to add the full menu, or add items manually.
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

function MenuItemForm({
  item,
  onSave,
  onCancel,
}: {
  item: MenuItem | null
  onSave: () => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(item?.name || '')
  const [description, setDescription] = useState(item?.description || '')
  const [price, setPrice] = useState(item?.price?.toString() || '')
  const [category, setCategory] = useState(item?.category || MENU_CATEGORIES[0])
  const [customizable, setCustomizable] = useState(item?.customizable ?? false)
  const [isAvailable, setIsAvailable] = useState(item?.is_available ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const data = {
      name,
      description,
      price: parseFloat(price),
      category,
      customizable,
      is_available: isAvailable,
    }

    if (isNaN(data.price) || data.price < 0) {
      setError('Please enter a valid price')
      setSaving(false)
      return
    }

    let result
    if (item) {
      result = await supabase.from('menu_items').update(data).eq('id', item.id)
    } else {
      result = await supabase.from('menu_items').insert(data)
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
        {item ? 'Edit Menu Item' : 'New Menu Item'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Name</label>
            <input
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            >
              {MENU_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-text-dark mb-1">Description</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-dark mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={price}
              onChange={e => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={customizable}
                onChange={e => setCustomizable(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-text-dark">Customizable</span>
            </label>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                checked={isAvailable}
                onChange={e => setIsAvailable(e.target.checked)}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <span className="text-sm text-text-dark">Available</span>
            </label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-secondary px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : (item ? 'Update Item' : 'Add Item')}
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
