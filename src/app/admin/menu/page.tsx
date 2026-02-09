'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MENU_CATEGORIES, MENU_ITEMS } from '@/lib/menu-data'
import type { MenuItem } from '@/lib/types/database'
import { useAuthStore } from '@/stores/auth-store'
import { uploadMenuImage, deleteMenuImage } from '@/lib/supabase/upload-image'

export default function AdminMenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [seeding, setSeeding] = useState(false)
  const { profile } = useAuthStore()
  const supabase = useMemo(() => createClient(), [])

  const fetchMenu = useCallback(async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('name')
    setMenuItems(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

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

  async function toggleFeatured(item: MenuItem) {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_featured: !item.is_featured })
      .eq('id', item.id)

    if (!error) {
      setMenuItems(prev =>
        prev.map(i => i.id === item.id ? { ...i, is_featured: !i.is_featured } : i)
      )
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Are you sure you want to delete this item?')) return
    const item = menuItems.find(i => i.id === id)
    if (item?.image_url) {
      await deleteMenuImage(item.image_url)
    }
    const { error } = await supabase.from('menu_items').delete().eq('id', id)
    if (!error) {
      setMenuItems(prev => prev.filter(i => i.id !== id))
    }
  }

  function openForm(item: MenuItem | null) {
    setEditingItem(item)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingItem(null)
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
            onClick={() => openForm(null)}
            className="bg-primary text-secondary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-light transition-colors"
          >
            + Add Item
          </button>
        </div>
      </div>

      {/* Menu items table */}
      <div className="bg-white rounded-xl border border-secondary-dark/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary/5">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-primary">Photo</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Name</th>
                <th className="text-left px-4 py-3 font-medium text-primary hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Price</th>
                <th className="text-left px-4 py-3 font-medium text-primary">Status</th>
                <th className="text-center px-4 py-3 font-medium text-primary">Featured</th>
                <th className="text-right px-4 py-3 font-medium text-primary">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark/10">
              {menuItems.map(item => (
                <tr
                  key={item.id}
                  className="hover:bg-primary/5 cursor-pointer"
                  onClick={() => openForm(item)}
                >
                  <td className="px-4 py-3">
                    {item.image_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center">
                        <svg className="w-5 h-5 text-accent/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-text-dark">{item.name}</p>
                      <p className="text-xs text-accent mt-0.5 hidden sm:block line-clamp-1">{item.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-accent hidden md:table-cell">{item.category}</td>
                  <td className="px-4 py-3 text-accent">${item.price.toFixed(2)}</td>
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
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
                  <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => toggleFeatured(item)}
                      className={`text-xl transition-colors ${
                        item.is_featured
                          ? 'text-amber-500 hover:text-amber-600'
                          : 'text-gray-300 hover:text-amber-400'
                      }`}
                      title={item.is_featured ? 'Remove from featured' : 'Add to featured'}
                    >
                      {item.is_featured ? '★' : '☆'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => openForm(item)}
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
                  <td colSpan={7} className="px-4 py-8 text-center text-accent">
                    No menu items yet. Click &quot;Seed Default Menu&quot; to add the full menu, or add items manually.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <MenuItemModal
          item={editingItem}
          onSave={async () => {
            closeForm()
            await fetchMenu()
          }}
          onCancel={closeForm}
        />
      )}
    </div>
  )
}

function MenuItemModal({
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
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false)
  const [featuredTagline, setFeaturedTagline] = useState(item?.featured_tagline || '')
  const [featuredOrder, setFeaturedOrder] = useState(item?.featured_order?.toString() || '0')
  const [imageUrl, setImageUrl] = useState(item?.image_url || '')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPG, PNG, WebP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB')
      return
    }

    setImageFile(file)
    setError('')

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImagePreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    setImageFile(null)
    setImagePreview(null)
    setImageUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const parsedPrice = parseFloat(price)
      if (isNaN(parsedPrice) || parsedPrice < 0) {
        setError('Please enter a valid price')
        return
      }

      let finalImageUrl = imageUrl
      if (imageFile) {
        setUploading(true)
        const url = await uploadMenuImage(imageFile, item?.id)
        setUploading(false)
        if (!url) {
          setError('Failed to upload image. Please try again.')
          return
        }
        if (item?.image_url) {
          await deleteMenuImage(item.image_url)
        }
        finalImageUrl = url
      }

      if (!imagePreview && item?.image_url) {
        await deleteMenuImage(item.image_url)
        finalImageUrl = ''
      }

      const data = {
        name,
        description,
        price: parsedPrice,
        category,
        customizable,
        is_available: isAvailable,
        is_featured: isFeatured,
        featured_tagline: featuredTagline || null,
        featured_order: parseInt(featuredOrder) || 0,
        image_url: finalImageUrl || null,
      }

      let result
      if (item) {
        result = await supabase.from('menu_items').update(data).eq('id', item.id)
      } else {
        result = await supabase.from('menu_items').insert(data)
      }

      if (result.error) {
        setError(result.error.message)
      } else {
        await onSave()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setUploading(false)
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onCancel}
      />

      {/* Modal panel */}
      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl shadow-2xl max-h-[100dvh] sm:max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-secondary-dark/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary">
            {item ? 'Edit Item' : 'New Item'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center text-accent hover:bg-gray-100 transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
          )}

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-text-dark mb-2">Product Photo</label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {imagePreview ? (
                  <div className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-[100px] h-[100px] rounded-xl object-cover border border-secondary-dark/20"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-600 shadow-sm"
                    >
                      &times;
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-[100px] h-[100px] rounded-xl border-2 border-dashed border-secondary-dark/30 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    <svg className="w-7 h-7 text-accent/40 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-accent/60">Add photo</span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-secondary text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary-dark transition-colors"
                >
                  {imagePreview ? 'Change Photo' : 'Upload Photo'}
                </button>
                <p className="text-xs text-accent mt-2">
                  JPG, PNG, or WebP. Max 5MB.
                </p>
                {uploading && (
                  <p className="text-xs text-primary mt-1 font-medium">Uploading...</p>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Name</label>
              <input
                required
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
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
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-dark mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={customizable}
                  onChange={e => setCustomizable(e.target.checked)}
                  className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm text-text-dark">Customizable</span>
              </label>
            </div>
            <div className="flex items-end pb-1">
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
          </div>

          {/* Featured Section */}
          <div className="border-t border-secondary-dark/10 pt-4">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={e => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
              />
              <span className="text-sm font-medium text-text-dark">★ Feature on Homepage</span>
            </label>
            {isFeatured && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-6">
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Tagline</label>
                  <input
                    value={featuredTagline}
                    onChange={e => setFeaturedTagline(e.target.value)}
                    placeholder="e.g. Our most loved creation"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                  />
                  <p className="text-xs text-accent mt-1">Short marketing tagline</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-dark mb-1">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={featuredOrder}
                    onChange={e => setFeaturedOrder(e.target.value)}
                    className="w-24 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
                  />
                  <p className="text-xs text-accent mt-1">Lower = first</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer actions — sticky at bottom */}
          <div className="sticky bottom-0 -mx-6 -mb-6 px-6 py-4 bg-white border-t border-secondary-dark/10 flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-primary text-secondary py-3 rounded-xl text-sm font-bold hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading image...' : saving ? 'Saving...' : (item ? 'Save Changes' : 'Add Item')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
