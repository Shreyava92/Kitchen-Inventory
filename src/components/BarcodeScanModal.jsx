import { useEffect, useRef, useState } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'
import { autoFill } from '../lib/autoFill'
import { UNITS, capitalize } from '../lib/constants'
import ItemEmoji from './ItemEmoji'

function parseQuantityString(str) {
  if (!str) return { quantity: null, unit: 'count' }
  const match = str.match(/(\d+\.?\d*)\s*([a-zA-Z]+)/)
  if (!match) return { quantity: null, unit: 'count' }
  const num = parseFloat(match[1])
  const raw = match[2].toLowerCase()
  const unitMap = { oz: 'oz', g: 'g', kg: 'kg', ml: 'ml', l: 'L', lb: 'lbs', lbs: 'lbs', fl: 'ml' }
  return { quantity: num, unit: unitMap[raw] ?? 'count' }
}

async function lookupBarcode(barcode) {
  const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
  const data = await res.json()
  if (data.status !== 1) return null
  const p = data.product
  const name = p.product_name_en || p.product_name || ''
  const { quantity, unit } = parseQuantityString(p.quantity)
  const filled = autoFill(name)
  return {
    name: name.trim(),
    quantity,
    unit: unit ?? filled.unit,
    category: filled.category,
    subcategory: filled.subcategory,
    barcode,
  }
}

export default function BarcodeScanModal({ locations, onSave, onClose }) {
  const videoRef = useRef()
  const readerRef = useRef()
  const [phase, setPhase] = useState('scanning') // scanning | loading | confirm | notfound | error
  const [product, setProduct] = useState(null)
  const [error, setError] = useState(null)
  const [locationId, setLocationId] = useState(locations[0]?.id ?? '')

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    readerRef.current = reader
    let stopped = false

    reader.decodeFromConstraints(
      { video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } },
      videoRef.current,
      async (result, err) => {
        if (!result || stopped) return
        stopped = true
        reader.reset()
        setPhase('loading')
        try {
          const p = await lookupBarcode(result.getText())
          if (!p || !p.name) setPhase('notfound')
          else { setProduct(p); setPhase('confirm') }
        } catch {
          setPhase('error')
        }
      }
    ).catch(() => setPhase('error'))

    return () => { stopped = true; try { reader.reset() } catch {} }
  }, [])

  function handleSave() {
    if (!product) return
    onSave({
      name: product.name,
      quantity: product.quantity ?? 1,
      unit: product.unit,
      category: product.category,
      subcategory: product.subcategory,
      location_id: locationId || null,
    })
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/60">
        <span className="text-white font-medium text-sm">
          {phase === 'scanning' ? 'Point camera at barcode' : phase === 'loading' ? 'Looking up product...' : ''}
        </span>
        <button onClick={onClose} className="text-white text-2xl leading-none">×</button>
      </div>

      {/* Camera */}
      <div className={`relative flex-1 ${phase !== 'scanning' ? 'hidden' : ''}`}>
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        {/* Viewfinder overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-40 border-2 border-white/70 rounded-lg" />
        </div>
      </div>

      {/* Loading */}
      {phase === 'loading' && (
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-3">
          <div className="text-4xl animate-pulse">🔍</div>
          <p className="text-sm">Looking up product...</p>
        </div>
      )}

      {/* Not found */}
      {phase === 'notfound' && (
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-4 px-6">
          <div className="text-4xl">😕</div>
          <p className="text-sm text-center">Product not found in database.</p>
          <button
            onClick={() => { readerRef.current = new BrowserMultiFormatReader(); setPhase('scanning') }}
            className="bg-white text-gray-900 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Error */}
      {phase === 'error' && (
        <div className="flex-1 flex flex-col items-center justify-center text-white gap-4 px-6">
          <div className="text-4xl">⚠️</div>
          <p className="text-sm text-center">Failed to look up product. Check your connection.</p>
          <button
            onClick={() => setPhase('scanning')}
            className="bg-white text-gray-900 rounded-lg px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
        </div>
      )}

      {/* Confirm */}
      {phase === 'confirm' && product && (
        <div className="flex-1 overflow-auto bg-gray-50 rounded-t-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <ItemEmoji name={product.name} category={product.category} subcategory={product.subcategory} size="lg" />
            <div>
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-400 capitalize">{product.subcategory || product.category}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
              <input
                type="number"
                min="0"
                value={product.quantity ?? ''}
                onChange={e => setProduct(p => ({ ...p, quantity: e.target.value === '' ? null : Number(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Unit</label>
              <select
                value={product.unit}
                onChange={e => setProduct(p => ({ ...p, unit: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                {UNITS.map(u => <option key={u} value={u}>{capitalize(u)}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Location</label>
            <select
              value={locationId}
              onChange={e => setLocationId(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">— No location</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              Add to inventory
            </button>
            <button
              onClick={() => setPhase('scanning')}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2.5 text-sm font-medium"
            >
              Scan another
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
