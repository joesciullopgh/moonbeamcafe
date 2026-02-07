'use client'

import { useState } from 'react'
import type { MenuItem } from '@/lib/types/database'
import { CUSTOMIZATION_OPTIONS } from '@/lib/menu-data'
import { useCartStore, type CartCustomization } from '@/stores/cart-store'

interface Props {
  item: MenuItem
  onClose: () => void
}

type Option = { name: string; price_modifier: number }

export default function CustomizationModal({ item, onClose }: Props) {
  const [selectedSize, setSelectedSize] = useState<Option>(CUSTOMIZATION_OPTIONS.size[0])
  const [selectedMilk, setSelectedMilk] = useState<Option>(CUSTOMIZATION_OPTIONS.milk[0])
  const [selectedShots, setSelectedShots] = useState<Option>(CUSTOMIZATION_OPTIONS.shots[0])
  const [selectedSweetness, setSelectedSweetness] = useState<Option>(CUSTOMIZATION_OPTIONS.sweetness[2]) // Regular
  const [selectedTemp, setSelectedTemp] = useState<Option>(CUSTOMIZATION_OPTIONS.temperature[0])
  const [selectedExtras, setSelectedExtras] = useState<Option[]>([])
  const [specialInstructions, setSpecialInstructions] = useState('')
  const addItem = useCartStore(s => s.addItem)

  function toggleExtra(extra: Option) {
    setSelectedExtras(prev =>
      prev.find(e => e.name === extra.name)
        ? prev.filter(e => e.name !== extra.name)
        : [...prev, extra]
    )
  }

  function getCustomizationTotal() {
    let total = selectedSize.price_modifier
    total += selectedMilk.price_modifier
    total += selectedShots.price_modifier
    total += selectedTemp.price_modifier
    total += selectedExtras.reduce((sum, e) => sum + e.price_modifier, 0)
    return total
  }

  function handleAddToCart() {
    const customizations: CartCustomization[] = [
      { type: 'size', name: selectedSize.name, price_modifier: selectedSize.price_modifier },
      { type: 'milk', name: selectedMilk.name, price_modifier: selectedMilk.price_modifier },
      { type: 'shots', name: selectedShots.name, price_modifier: selectedShots.price_modifier },
      { type: 'sweetness', name: selectedSweetness.name, price_modifier: selectedSweetness.price_modifier },
      { type: 'temperature', name: selectedTemp.name, price_modifier: selectedTemp.price_modifier },
      ...selectedExtras.map(e => ({ type: 'extras', name: e.name, price_modifier: e.price_modifier })),
    ]
    addItem(item, customizations, specialInstructions)
    onClose()
  }

  const totalPrice = item.price + getCustomizationTotal()

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-xl font-bold text-primary">{item.name}</h2>
            <p className="text-sm text-accent">{item.description}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Size */}
          <OptionGroup
            label="Size"
            options={CUSTOMIZATION_OPTIONS.size}
            selected={selectedSize.name}
            onSelect={(opt) => setSelectedSize(opt)}
          />

          {/* Milk */}
          <OptionGroup
            label="Milk"
            options={CUSTOMIZATION_OPTIONS.milk}
            selected={selectedMilk.name}
            onSelect={(opt) => setSelectedMilk(opt)}
          />

          {/* Shots */}
          <OptionGroup
            label="Espresso Shots"
            options={CUSTOMIZATION_OPTIONS.shots}
            selected={selectedShots.name}
            onSelect={(opt) => setSelectedShots(opt)}
          />

          {/* Sweetness */}
          <OptionGroup
            label="Sweetness"
            options={CUSTOMIZATION_OPTIONS.sweetness}
            selected={selectedSweetness.name}
            onSelect={(opt) => setSelectedSweetness(opt)}
          />

          {/* Temperature */}
          <OptionGroup
            label="Temperature"
            options={CUSTOMIZATION_OPTIONS.temperature}
            selected={selectedTemp.name}
            onSelect={(opt) => setSelectedTemp(opt)}
          />

          {/* Extras */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">Extras</h3>
            <div className="flex flex-wrap gap-2">
              {CUSTOMIZATION_OPTIONS.extras.map(extra => (
                <button
                  key={extra.name}
                  onClick={() => toggleExtra(extra)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedExtras.find(e => e.name === extra.name)
                      ? 'bg-primary text-secondary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {extra.name}
                  {extra.price_modifier > 0 && (
                    <span className="ml-1 text-xs opacity-70">+${extra.price_modifier.toFixed(2)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <h3 className="text-sm font-semibold text-primary mb-2">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Any special requests..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none text-sm"
            />
          </div>
        </div>

        {/* Footer with Add to Cart */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4">
          <button
            onClick={handleAddToCart}
            className="w-full bg-primary text-secondary py-3 rounded-lg font-semibold hover:bg-primary-light transition-colors text-lg"
          >
            Add to Cart - ${totalPrice.toFixed(2)}
          </button>
        </div>
      </div>
    </div>
  )
}

function OptionGroup<T extends { name: string; price_modifier: number }>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: readonly T[]
  selected: string
  onSelect: (opt: T) => void
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-primary mb-2">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt.name}
            onClick={() => onSelect(opt)}
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              selected === opt.name
                ? 'bg-primary text-secondary'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.name}
            {opt.price_modifier > 0 && (
              <span className="ml-1 text-xs opacity-70">+${opt.price_modifier.toFixed(2)}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
