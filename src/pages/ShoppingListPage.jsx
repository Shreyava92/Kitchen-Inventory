import { useEffect, useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import ItemEmoji from '../components/ItemEmoji'
import { autoFill } from '../lib/autoFill'
import { capitalize } from '../lib/constants'

export default function ShoppingListPage() {
  const { household } = useAuth()
  const [listItems, setListItems] = useState([])
  const [quickName, setQuickName] = useState('')
  const [quickQty, setQuickQty] = useState(1)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  useEffect(() => { fetchList() }, [household])

  async function fetchList() {
    const { data } = await supabase
      .from('shopping_list')
      .select('*')
      .eq('household_id', household.id)
      .order('checked')
      .order('created_at')
    setListItems(data ?? [])
  }

  async function handleAutoFill() {
    setError(null)
    const today = new Date().toISOString().split('T')[0]

    const { data: items, error: fetchErr } = await supabase
      .from('items')
      .select('*')
      .eq('household_id', household.id)

    if (fetchErr) { setError(fetchErr.message); return }

    const candidates = (items ?? []).filter(i => {
      const isExpired = i.expiry_date && i.expiry_date < today
      const isLowStock = i.min_quantity != null && i.quantity != null && i.quantity <= i.min_quantity
      return isExpired || isLowStock
    })

    if (candidates.length === 0) { setError('No low stock or expired items found.'); return }

    const existing = new Set(listItems.map(l => l.item_id).filter(Boolean))
    const toAdd = candidates.filter(i => !existing.has(i.id))
    if (toAdd.length === 0) { setError('All matching items are already on the list.'); return }

    const rows = toAdd.map(i => {
      const isExpired = i.expiry_date && i.expiry_date < today
      return {
        household_id: household.id,
        name: i.name,
        quantity: i.min_quantity != null && i.quantity != null
          ? Math.max(1, i.min_quantity - i.quantity)
          : 1,
        unit: i.unit,
        category: i.category,
        subcategory: i.subcategory,
        item_id: i.id,
        note: isExpired ? 'Expired in inventory' : null,
        checked: false,
      }
    })

    const { error: insertErr } = await supabase.from('shopping_list').insert(rows)
    if (insertErr) { setError(insertErr.message); return }
    fetchList()
  }

  async function handleAdd() {
    const name = quickName.trim()
    if (!name) return
    const filled = autoFill(name)

    const existing = listItems.find(i => i.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      const newQty = (existing.quantity ?? 0) + (quickQty || 1)
      await supabase.from('shopping_list').update({ quantity: newQty, checked: false }).eq('id', existing.id)
    } else {
      await supabase.from('shopping_list').insert({
        household_id: household.id,
        name,
        quantity: quickQty || null,
        unit: filled.unit,
        category: filled.category,
        subcategory: filled.subcategory,
        checked: false,
      })
    }

    setQuickName('')
    setQuickQty(1)
    inputRef.current?.focus()
    fetchList()
  }

  async function toggleChecked(item) {
    const checked = !item.checked
    await supabase.from('shopping_list').update({ checked }).eq('id', item.id)
    setListItems(prev => prev.map(i => i.id === item.id ? { ...i, checked } : i))
  }

  async function handleClearChecked() {
    const checkedIds = listItems.filter(i => i.checked).map(i => i.id)
    if (checkedIds.length === 0) return
    await supabase.from('shopping_list').delete().in('id', checkedIds)
    setListItems(prev => prev.filter(i => !i.checked))
  }

  async function handleDelete(id) {
    await supabase.from('shopping_list').delete().eq('id', id)
    setListItems(prev => prev.filter(i => i.id !== id))
  }

  const unchecked = listItems.filter(i => !i.checked)
  const checked = listItems.filter(i => i.checked)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Shopping List</h2>
        <div className="flex gap-2">
          {checked.length > 0 && (
            <button
              onClick={handleClearChecked}
              className="text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg px-3 py-1.5"
            >
              Clear checked
            </button>
          )}
          <button
            onClick={handleAutoFill}
            className="text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 font-medium"
          >
            Auto-fill low stock
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">{error}</p>
      )}

      {/* Quick add */}
      <div className="bg-white border border-gray-200 rounded-xl p-3 mb-5 flex items-center gap-2">
        <ItemEmoji name={quickName} category={autoFill(quickName).category} subcategory={autoFill(quickName).subcategory} size="sm" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Add item..."
          value={quickName}
          onChange={e => setQuickName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="flex-1 text-sm border-b border-gray-300 focus:border-green-500 focus:outline-none py-1 bg-transparent"
        />
        <input
          type="number"
          min="0"
          value={quickQty}
          onChange={e => setQuickQty(Number(e.target.value))}
          onKeyDown={e => e.key === 'Enter' && handleAdd()}
          className="w-14 text-sm border border-gray-200 rounded px-2 py-1 text-center focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <button
          onClick={handleAdd}
          className="bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg px-3 py-1.5 font-medium"
        >
          Add
        </button>
      </div>

      {/* List */}
      {listItems.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-3xl mb-3">🛒</p>
          <p className="text-sm">Your list is empty.</p>
          <p className="text-xs mt-1">Add items manually or tap "Auto-fill low stock".</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {unchecked.map(item => (
            <ListItem key={item.id} item={item} onToggle={toggleChecked} onDelete={handleDelete} />
          ))}

          {checked.length > 0 && unchecked.length > 0 && (
            <li className="border-t border-gray-100 pt-2 mt-2" />
          )}

          {checked.map(item => (
            <ListItem key={item.id} item={item} onToggle={toggleChecked} onDelete={handleDelete} />
          ))}
        </ul>
      )}
    </div>
  )
}

function ListItem({ item, onToggle, onDelete }) {
  return (
    <li className={`bg-white border rounded-lg px-4 py-3 flex items-center gap-3 transition-opacity ${item.checked ? 'opacity-50 border-gray-100' : 'border-gray-200'}`}>
      <button
        onClick={() => onToggle(item)}
        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
          item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300 hover:border-green-400'
        }`}
      >
        {item.checked && <span className="text-white text-xs">✓</span>}
      </button>

      <ItemEmoji name={item.name} category={item.category} subcategory={item.subcategory} size="sm" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className={`text-sm font-medium ${item.checked ? 'line-through text-gray-400' : 'text-gray-900'}`}>
            {item.name}
          </p>
          {item.note && (
            <span className="text-xs bg-red-100 text-red-600 rounded px-1.5 py-0.5">{item.note}</span>
          )}
        </div>
        {(item.quantity || item.subcategory) && (
          <p className="text-xs text-gray-400">
            {item.quantity != null && `${item.quantity} ${item.unit ?? ''}`}
            {item.quantity != null && item.subcategory && ' · '}
            {item.subcategory && capitalize(item.subcategory)}
          </p>
        )}
      </div>

      <button onClick={() => onDelete(item.id)} className="text-gray-300 hover:text-red-400 text-lg leading-none shrink-0">×</button>
    </li>
  )
}
