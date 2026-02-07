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
  const [quantity, setQuantity] = useState(1)
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
    for (let i = 0; i < quantity; i++) {
      addItem(item, customizations, specialInstructions)
    }
    onClose()
  }

  const unitPrice = item.price + getCustomizationTotal()
  const totalPrice = unitPrice * quantity

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 pt-5 pb-4 flex items-start justify-between rounded-t-3xl z-10">
          <div className="flex-1 pr-4">
            <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">{item.description}</p>
            <p className="text-lg font-bold text-primary mt-2">${item.price.toFixed(2)}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors shrink-0 mt-1"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-7">
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

          {/* Extras — multi-select */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Extras</h3>
            <div className="flex flex-wrap gap-2.5">
              {CUSTOMIZATION_OPTIONS.extras.map(extra => {
                const isSelected = !!selectedExtras.find(e => e.name === extra.name)
                return (
                  <button
                    key={extra.name}
                    onClick={() => toggleExtra(extra)}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-1'
                        : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isSelected && (
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {extra.name}
                      {extra.price_modifier > 0 && (
                        <span className={isSelected ? 'text-white/70' : 'text-gray-400'}>+${extra.price_modifier.toFixed(2)}</span>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Special Instructions */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Special Instructions</h3>
            <textarea
              value={specialInstructions}
              onChange={e => setSpecialInstructions(e.target.value)}
              placeholder="Allergies, preferences, or special requests..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none text-sm text-gray-700 placeholder-gray-400 transition-all resize-none"
            />
          </div>
        </div>

        {/* Footer — quantity + add to cart */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] rounded-b-3xl">
          <div className="flex items-center gap-4">
            {/* Quantity */}
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden shrink-0">
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg font-medium"
              >
                -
              </button>
              <span className="w-8 text-center font-bold text-gray-900">{quantity}</span>
              <button
                onClick={() => setQuantity(q => q + 1)}
                className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors text-lg font-medium"
              >
                +
              </button>
            </div>

            {/* Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary-light transition-all text-base shadow-lg shadow-primary/25 active:scale-[0.98]"
            >
              Add to Cart &middot; ${totalPrice.toFixed(2)}
            </button>
          </div>
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
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{label}</h3>
      <div className="flex flex-wrap gap-2.5">
        {options.map(opt => {
          const isSelected = selected === opt.name
          return (
            <button
              key={opt.name}
              onClick={() => onSelect(opt)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-primary text-white shadow-md ring-2 ring-primary ring-offset-1'
                  : 'bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-400 hover:bg-gray-100'
              }`}
            >
              {opt.name}
              {opt.price_modifier > 0 && (
                <span className={`ml-1.5 text-xs ${isSelected ? 'text-white/70' : 'text-gray-400'}`}>
                  +${opt.price_modifier.toFixed(2)}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
