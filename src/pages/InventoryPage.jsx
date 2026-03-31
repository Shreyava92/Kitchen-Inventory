import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ItemForm from '../components/ItemForm'
import ItemEmoji from '../components/ItemEmoji'
import { autoFill } from '../lib/autoFill'
import BarcodeScanModal from '../components/BarcodeScanModal'

function expiryStatus(dateStr) {
  if (!dateStr) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const expiry = new Date(dateStr)
  const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return 'expired'
  if (diffDays <= 7) return 'soon'
  return 'ok'
}

const expiryBadge = {
  expired: 'bg-red-100 text-red-700',
  soon: 'bg-yellow-100 text-yellow-700',
  ok: 'bg-gray-100 text-gray-500',
}

export default function InventoryPage() {
  const { household } = useAuth()
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [showAdd, setShowAdd] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [showBarcode, setShowBarcode] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickName, setQuickName] = useState('')
  const [quickQty, setQuickQty] = useState(1)
  const quickInputRef = useRef()
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterLocation, setFilterLocation] = useState('')

  useEffect(() => { fetchAll() }, [household])

  async function fetchAll() {
    const [{ data: itemData }, { data: locData }] = await Promise.all([
      supabase.from('items').select('*, locations(name)').eq('household_id', household.id).order('name'),
      supabase.from('locations').select('*').eq('household_id', household.id).order('name'),
    ])
    setItems(itemData ?? [])
    setLocations(locData ?? [])
  }

  async function handleAdd(values) {
    await supabase.from('items').insert({ ...values, household_id: household.id })
    setShowAdd(false)
    fetchAll()
  }

  async function handleEdit(values) {
    await supabase.from('items').update(values).eq('id', editItem.id)
    setEditItem(null)
    fetchAll()
  }

  async function handleDelete(id) {
    await supabase.from('items').delete().eq('id', id)
    fetchAll()
  }

  async function handleConsume(item) {
    const newQty = Math.max(0, (item.quantity ?? 1) - 1)
    await supabase.from('items').update({ quantity: newQty }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))
  }

  async function handleBarcodeAdd(values) {
    await supabase.from('items').insert({ ...values, household_id: household.id })
    setShowBarcode(false)
    fetchAll()
  }

  async function handleQuickAdd() {
    const name = quickName.trim()
    if (!name) return
    const filled = autoFill(name)
    await supabase.from('items').insert({
      household_id: household.id,
      name,
      quantity: quickQty,
      unit: filled.unit,
      category: filled.category,
      subcategory: filled.subcategory,
      location_id: locations[0]?.id ?? null,
    })
    setQuickName('')
    setQuickQty(1)
    setShowQuickAdd(false)
    fetchAll()
  }

  function isLowStock(item) {
    return item.min_quantity != null && item.quantity != null && item.quantity <= item.min_quantity
  }

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = !filterCategory || item.category === filterCategory
    const matchLocation = !filterLocation || item.location_id === filterLocation
    return matchSearch && matchCategory && matchLocation
  })

  const grouped = filtered.reduce((acc, item) => {
    const key = item.locations?.name ?? 'Uncategorized'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const groupEntries = Object.entries(grouped).sort(([a], [b]) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Inventory</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBarcode(true)}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium"
            title="Scan barcode"
          >
            📷
          </button>
          <button
            onClick={() => { setShowQuickAdd(true); setShowAdd(false); setTimeout(() => quickInputRef.current?.focus(), 50) }}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg px-3 py-2 text-sm font-medium"
          >
            Quick add
          </button>
          <button
            onClick={() => { setShowAdd(true); setShowQuickAdd(false) }}
            className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            + Add item
          </button>
        </div>
      </div>

      {/* Quick add bar */}
      {showQuickAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-3 mb-4 flex items-center gap-2">
          <ItemEmoji name={quickName} category={autoFill(quickName).category} subcategory={autoFill(quickName).subcategory} size="sm" />
          <input
            ref={quickInputRef}
            type="text"
            placeholder="Item name..."
            value={quickName}
            onChange={e => setQuickName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            className="flex-1 text-sm border-b border-gray-300 focus:border-green-500 focus:outline-none py-1 bg-transparent"
          />
          <input
            type="number"
            min="0"
            value={quickQty}
            onChange={e => setQuickQty(Number(e.target.value))}
            onKeyDown={e => e.key === 'Enter' && handleQuickAdd()}
            className="w-14 text-sm border border-gray-200 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <button onClick={handleQuickAdd} className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-3 py-1.5 font-medium">Add</button>
          <button onClick={() => { setShowQuickAdd(false); setQuickName(''); setQuickQty(1) }} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All categories</option>
          {['food', 'supplement', 'beverage', 'other'].map(c => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
        <select
          value={filterLocation}
          onChange={e => setFilterLocation(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <option value="">All locations</option>
          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>
      </div>

      {/* Add form */}
      {showAdd && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">New item</h3>
          <ItemForm locations={locations} onSubmit={handleAdd} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {/* Grouped list */}
      {groupEntries.map(([locationName, locationItems]) => (
        <div key={locationName} className="mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{locationName}</h3>
          <ul className="space-y-2">
            {locationItems.map(item => {
              const status = expiryStatus(item.expiry_date)
              return (
                <li key={item.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                  {editItem?.id === item.id ? (
                    <ItemForm
                      locations={locations}
                      initial={editItem}
                      onSubmit={handleEdit}
                      onCancel={() => setEditItem(null)}
                    />
                  ) : (
                    <div className="flex items-start gap-3">
                      <ItemEmoji name={item.name} category={item.category} subcategory={item.subcategory} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-gray-900">{item.name}</span>
                          {item.subcategory && (
                            <span className="text-xs text-gray-400 capitalize">{item.subcategory}</span>
                          )}
                          {isLowStock(item) && (
                            <span className="text-xs bg-orange-100 text-orange-700 rounded px-1.5 py-0.5">low stock</span>
                          )}
                          {status && status !== 'ok' && (
                            <span className={`text-xs rounded px-1.5 py-0.5 ${expiryBadge[status]}`}>
                              {status === 'expired' ? 'expired' : `exp. ${item.expiry_date}`}
                            </span>
                          )}
                        </div>
                        {(item.quantity != null || item.unit) && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {item.quantity} {item.unit}
                            {item.min_quantity != null && ` · min ${item.min_quantity}`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleConsume(item)}
                          disabled={item.quantity === 0}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 disabled:opacity-30 flex items-center justify-center text-base leading-none"
                          title="Use one"
                        >−</button>
                        <button
                          onClick={async () => {
                            const newQty = (item.quantity ?? 0) + 1
                            await supabase.from('items').update({ quantity: newQty }).eq('id', item.id)
                            setItems(prev => prev.map(i => i.id === item.id ? { ...i, quantity: newQty } : i))
                          }}
                          className="w-7 h-7 rounded-full border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center text-base leading-none"
                          title="Add one"
                        >+</button>
                        <button onClick={() => setEditItem(item)} className="text-xs text-gray-400 hover:text-gray-700">Edit</button>
                        <button onClick={() => handleDelete(item.id)} className="text-xs text-red-400 hover:text-red-600">Delete</button>
                      </div>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {filtered.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No items found.</p>
      )}

      {showBarcode && (
        <BarcodeScanModal
          locations={locations}
          onSave={handleBarcodeAdd}
          onClose={() => setShowBarcode(false)}
        />
      )}
    </div>
  )
}
