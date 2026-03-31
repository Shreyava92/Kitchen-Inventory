import { useState, useRef } from 'react'
import Tesseract from 'tesseract.js'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { CATEGORIES, FOOD_SUBCATEGORIES, OTHER_SUBCATEGORIES, UNITS, capitalize } from '../lib/constants'
import ItemEmoji from '../components/ItemEmoji'
import { runAgent, loadAgentSettings, saveAgentSettings, DEFAULT_SETTINGS, PROVIDERS } from '../lib/aiAgent'
import AgentSettingsModal from '../components/AgentSettingsModal'
import { autoFill } from '../lib/autoFill'

// Normalize OCR-mangled units to valid units
function normalizeUnit(raw) {
  const s = raw.toLowerCase().replace(/\s/g, '')
  if (/^[1l]?bs?$|^[1l]b$|^1bs$/.test(s)) return 'lbs'
  if (/^oz$|^0z$/.test(s)) return 'oz'
  if (/^kg$/.test(s)) return 'kg'
  if (/^g$/.test(s)) return 'g'
  if (/^[lg]?gal$|^1gal$/.test(s)) return 'gal'
  if (/^ml$/.test(s)) return 'ml'
  if (/^pk$|^pack$/.test(s)) return 'count'
  if (/^ct$|^count$/.test(s)) return 'count'
  if (/^dz$|^dozen$/.test(s)) return 'dozen'
  return null
}

function correctOcr(text) {
  return text
    .replace(/\b0il\b/gi, 'Oil')       // "Olive 0il" → "Olive Oil"
    .replace(/\blb\b/g, 'lbs')         // normalize lb → lbs
    .replace(/(\d)1b\b/g, '$1lb')      // "11b" → "1lb"
    .replace(/(\d)1bs\b/g, '$1lbs')    // "21bs" → "2lbs"
    .replace(/(\d)0z\b/g, '$1oz')      // "160z" → "16oz"
    .replace(/\bS([oO]z)\b/g, '5oz')   // "Soz" → "5oz" (S looks like 5 in OCR)
    .replace(/\blgal\b/gi, '1gal')     // "lgal" → "1gal" (l looks like 1 in OCR)
}

function parseReceiptText(text) {
  const lines = correctOcr(text).split('\n').map(l => l.trim()).filter(Boolean)
  const items = []

  for (const line of lines) {
    // Only process lines that end with a price
    if (!/\$?\d+\.\d{2}$/.test(line)) continue

    // Strip trailing price
    let rest = line.replace(/\s*\$?\d+\.\d{2}$/, '').trim()

    // Skip totals / non-item lines
    if (/subtotal|total|tax|change|cash|visa|mastercard|cashier|register|items purchased|thank|returns/i.test(rest)) continue

    let quantity = null
    let unit = null

    // 1. Leading quantity: "2 Whole Milk ..." or "3 Eggs ..."
    const leadingQty = rest.match(/^(\d+)\s+([A-Za-z].*)$/)
    if (leadingQty) {
      quantity = parseFloat(leadingQty[1])
      rest = leadingQty[2]
    }

    // 2. Standalone unit suffix with no number: "Eggs Large dz" → unit=dozen
    const standaloneUnit = rest.match(/\s+(dz|dozen|pk|ct)$/i)
    if (standaloneUnit) {
      const parsedUnit = normalizeUnit(standaloneUnit[1])
      if (parsedUnit) {
        unit = parsedUnit
        rest = rest.slice(0, standaloneUnit.index).trim()
      }
    }

    // 3. Trailing size with number: "Chicken Breast 2lbs" / "Greek Yogurt 32oz"
    const sizeMatch = rest.match(/\s+(\d+\.?\d*)\s*([A-Za-z]{1,4})$/)
    if (sizeMatch) {
      const parsedUnit = normalizeUnit(sizeMatch[2])
      if (parsedUnit) {
        if (quantity === null) quantity = parseFloat(sizeMatch[1])
        unit = parsedUnit
        rest = rest.slice(0, sizeMatch.index).trim()
      }
    }

    // 3. Trailing count descriptors: "Broccoli 1 head" / "Garlic 3 bulbs" / "Spinach 5oz bag"
    const countMatch = rest.match(/\s+(\d+)\s+(head|bag|bulbs?|pack|bunch)s?$/i)
    if (countMatch) {
      if (quantity === null) quantity = parseFloat(countMatch[1])
      unit = unit ?? 'count'
      rest = rest.slice(0, countMatch.index).trim()
    }

    const name = rest.trim().replace(/\b\w/g, c => c.toUpperCase())
    if (name.length < 2 || name.length > 50) continue

    const filled = autoFill(name)
    items.push({
      name,
      quantity: quantity ?? 1,
      unit: unit ?? filled.unit,
      category: filled.category,
      subcategory: filled.subcategory,
      location_id: '',
    })
  }
  return items
}

export default function ScanReceiptPage() {
  const { household } = useAuth()
  const [step, setStep] = useState('upload')
  const [parsedItems, setParsedItems] = useState([])
  const [locations, setLocations] = useState([])
  const [progress, setProgress] = useState(0)
  const [rawText, setRawText] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [showAgentSettings, setShowAgentSettings] = useState(false)
  const [agentSettings, setAgentSettings] = useState(() => {
    const saved = loadAgentSettings()
    if (!saved) { saveAgentSettings(DEFAULT_SETTINGS); return DEFAULT_SETTINGS }
    return saved
  })
  const fileRef = useRef()

  async function loadLocations() {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('household_id', household.id)
      .order('name')
    setLocations(data ?? [])
  }

  async function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setError(null)
    setProgress(0)
    setStep('scanning')
    await loadLocations()

    try {
      if (agentSettings) {
        // AI agent path
        const items = await runAgent(file, agentSettings, supabase)
        if (items.length === 0) {
          setError('No items could be extracted. Try a clearer photo.')
          setStep('upload')
          return
        }
        setParsedItems(items)
        setStep('review')
      } else {
        // Tesseract fallback
        const { data: { text } } = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') {
              setProgress(Math.round(m.progress * 100))
            }
          },
        })
        setRawText(text)
        const items = parseReceiptText(text)
        if (items.length === 0) {
          setError('No items could be extracted. Try a clearer photo.')
          setStep('upload')
          return
        }
        setParsedItems(items)
        setStep('review')
      }
    } catch (err) {
      setError(err.message ?? 'Failed to process image. Please try again.')
      setStep('upload')
    }
  }

  function updateItem(index, field, value) {
    setParsedItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item))
  }

  function removeItem(index) {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    const candidates = parsedItems.filter(item => item.name?.trim())

    // Fetch existing items for this household to detect duplicates by name
    const { data: existing, error: fetchError } = await supabase
      .from('items')
      .select('id, name, quantity')
      .eq('household_id', household.id)
    if (fetchError) { setError(fetchError.message); setSaving(false); return }

    const existingMap = Object.fromEntries(
      (existing ?? []).map(e => [e.name.toLowerCase(), e])
    )

    const toInsert = []
    const toUpdate = [] // { id, quantity }

    for (const item of candidates) {
      const match = existingMap[item.name.toLowerCase()]
      if (match) {
        toUpdate.push({ id: match.id, quantity: (match.quantity ?? 0) + (item.quantity ?? 1) })
      } else {
        toInsert.push({
          household_id: household.id,
          location_id: item.location_id || null,
          name: item.name,
          category: item.category,
          subcategory: item.subcategory || null,
          quantity: item.quantity ?? null,
          unit: item.unit || null,
          min_quantity: item.min_quantity ?? null,
        })
      }
    }

    if (toInsert.length > 0) {
      const { error } = await supabase.from('items').insert(toInsert)
      if (error) { setError(error.message); setSaving(false); return }
    }

    for (const { id, quantity } of toUpdate) {
      const { error } = await supabase.from('items').update({ quantity }).eq('id', id)
      if (error) { setError(error.message); setSaving(false); return }
    }

    // Save receipt record
    const storeName = rawText.split('\n').map(l => l.trim()).find(l => l.length > 2) ?? null
    await supabase.from('receipts').insert({
      household_id: household.id,
      store_name: storeName,
      item_count: candidates.length,
      raw_text: rawText,
    })

    setStep('done')
    setSaving(false)
  }

  if (step === 'upload') {
    const providerLabel = agentSettings ? PROVIDERS[agentSettings.provider]?.models.find(m => m.id === agentSettings.model)?.label : null
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-900">Scan Receipt</h2>
          <button
            onClick={() => setShowAgentSettings(true)}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1"
          >
            ⚙️ AI Agent
          </button>
        </div>

        {agentSettings ? (
          <div className="flex items-center gap-2 mb-4 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <span className="text-green-600 text-sm">🤖</span>
            <span className="text-xs text-green-700 font-medium">{providerLabel ?? agentSettings.model} active</span>
            <span className="text-xs text-green-500 ml-auto">Works on receipts &amp; product photos</span>
          </div>
        ) : (
          <p className="text-sm text-gray-500 mb-4">
            Using basic OCR. <button onClick={() => setShowAgentSettings(true)} className="text-green-600 underline">Enable AI agent</button> for smarter extraction.
          </p>
        )}

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">{error}</p>}

        <button
          onClick={() => fileRef.current.click()}
          className="w-full border-2 border-dashed border-gray-300 hover:border-green-400 rounded-xl p-10 text-center text-gray-500 hover:text-green-600 transition-colors"
        >
          <div className="text-4xl mb-2">{agentSettings ? '🤖' : '📷'}</div>
          <p className="text-sm font-medium">{agentSettings ? 'Tap to scan receipt or product photo' : 'Tap to upload receipt image'}</p>
          <p className="text-xs mt-1 text-gray-400">JPG, PNG, or HEIC</p>
        </button>
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

        {showAgentSettings && (
          <AgentSettingsModal
            onClose={(saved) => {
              setShowAgentSettings(false)
              if (saved !== null) setAgentSettings(loadAgentSettings())
            }}
          />
        )}
      </div>
    )
  }

  if (step === 'scanning') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <div className="text-4xl mb-4 animate-pulse">{agentSettings ? '🤖' : '🔍'}</div>
        <p className="text-sm font-medium text-gray-700">{agentSettings ? 'AI agent is reading your image...' : 'Scanning receipt...'}</p>
        {!agentSettings && (
          <>
            <div className="w-48 bg-gray-200 rounded-full h-1.5 mt-4">
              <div className="bg-green-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-2">{progress}%</p>
          </>
        )}
      </div>
    )
  }

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Items added!</h3>
        <p className="text-sm text-gray-500 mb-6">Your inventory has been updated.</p>
        <button
          onClick={() => { setStep('upload'); setParsedItems([]) }}
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Scan another receipt
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Review items</h2>
        <button onClick={() => setStep('upload')} className="text-sm text-gray-500 hover:text-gray-700">← Back</button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} found. Location is optional — items without one go to Uncategorized.
      </p>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">{error}</p>}

      <ul className="space-y-3 mb-6">
        {parsedItems.map((item, i) => (
          <li key={i} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-3">
              <ItemEmoji name={item.name} category={item.category} subcategory={item.subcategory} size="sm" />
              <input
                value={item.name}
                onChange={e => updateItem(i, 'name', e.target.value)}
                className="flex-1 text-sm font-medium border-b border-transparent hover:border-gray-300 focus:border-green-500 focus:outline-none py-0.5"
              />
              <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-600 shrink-0">Remove</button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Category</label>
                <select
                  value={item.category}
                  onChange={e => updateItem(i, 'category', e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{capitalize(c)}</option>)}
                </select>
              </div>
              {(item.category === 'food' || item.category === 'other') && (
                <div>
                  <label className="block text-xs text-gray-500 mb-0.5">Subcategory</label>
                  <select
                    value={item.subcategory}
                    onChange={e => updateItem(i, 'subcategory', e.target.value)}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                  >
                    <option value="">Select...</option>
                    {(item.category === 'food' ? FOOD_SUBCATEGORIES : OTHER_SUBCATEGORIES).map(s => (
                      <option key={s} value={s}>{capitalize(s)}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Qty</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.quantity ?? ''}
                  onChange={e => updateItem(i, 'quantity', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Min</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={item.min_quantity ?? ''}
                  onChange={e => updateItem(i, 'min_quantity', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Unit</label>
                <select
                  value={item.unit}
                  onChange={e => updateItem(i, 'unit', e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  {UNITS.map(u => <option key={u} value={u}>{capitalize(u)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-0.5">Location *</label>
                <select
                  value={item.location_id}
                  onChange={e => updateItem(i, 'location_id', e.target.value)}
                  className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                >
                  <option value="">—</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <button
        onClick={handleSave}
        disabled={saving || parsedItems.length === 0}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
      >
        {saving ? 'Saving...' : `Save ${parsedItems.length} item${parsedItems.length !== 1 ? 's' : ''} to inventory`}
      </button>

      {rawText && (
        <details className="mt-6">
          <summary className="text-xs text-gray-400 cursor-pointer">Raw OCR text (debug)</summary>
          <pre className="text-xs text-gray-500 bg-gray-50 rounded p-3 mt-2 whitespace-pre-wrap overflow-auto max-h-60">{rawText}</pre>
        </details>
      )}
    </div>
  )
}
