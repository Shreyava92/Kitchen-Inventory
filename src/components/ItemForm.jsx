import { useState } from 'react'
import { CATEGORIES, FOOD_SUBCATEGORIES, OTHER_SUBCATEGORIES, UNITS, capitalize } from '../lib/constants'
import ItemEmoji from './ItemEmoji'

export default function ItemForm({ locations, onSubmit, onCancel, initial = {} }) {
  const [name, setName] = useState(initial.name ?? '')
  const [category, setCategory] = useState(initial.category ?? 'food')
  const [subcategory, setSubcategory] = useState(initial.subcategory ?? '')
  const [locationId, setLocationId] = useState(initial.location_id ?? (locations[0]?.id ?? ''))
  const [quantity, setQuantity] = useState(initial.quantity ?? '')
  const [minQuantity, setMinQuantity] = useState(initial.min_quantity ?? '')
  const [unit, setUnit] = useState(initial.unit ?? 'count')
  const [expiryDate, setExpiryDate] = useState(initial.expiry_date ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      category,
      subcategory: (category === 'food' || category === 'other') ? subcategory : null,
      location_id: locationId,
      quantity: quantity === '' ? null : Number(quantity),
      min_quantity: minQuantity === '' ? null : Number(minQuantity),
      unit,
      expiry_date: expiryDate || null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Emoji + Name row */}
      <div className="flex items-center gap-3">
        <ItemEmoji name={name} category={category} subcategory={subcategory} size="lg" />
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
          <select
            value={category}
            onChange={e => { setCategory(e.target.value); setSubcategory('') }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
          </select>
        </div>

        {(category === 'food' || category === 'other') && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Subcategory</label>
            <select
              value={subcategory}
              onChange={e => setSubcategory(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">Select...</option>
              {(category === 'food' ? FOOD_SUBCATEGORIES : OTHER_SUBCATEGORIES).map(s => (
                <option key={s} value={s}>{capitalize(s)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
        <select
          value={locationId}
          onChange={e => setLocationId(e.target.value)}
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
          <input
            type="number"
            min="0"
            step="any"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Min qty</label>
          <input
            type="number"
            min="0"
            step="any"
            placeholder="—"
            value={minQuantity}
            onChange={e => setMinQuantity(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
          <select
            value={unit}
            onChange={e => setUnit(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {UNITS.map(u => <option key={u} value={u}>{capitalize(u)}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Expiry date</label>
        <input
          type="date"
          value={expiryDate}
          onChange={e => setExpiryDate(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Save
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
