import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function ReceiptsPage() {
  const { household } = useAuth()
  const [receipts, setReceipts] = useState([])
  const [expanded, setExpanded] = useState(null)

  useEffect(() => { fetchReceipts() }, [household])

  async function fetchReceipts() {
    const { data } = await supabase
      .from('receipts')
      .select('*')
      .eq('household_id', household.id)
      .order('scanned_at', { ascending: false })
    setReceipts(data ?? [])
  }

  async function handleDelete(id) {
    await supabase.from('receipts').delete().eq('id', id)
    setReceipts(prev => prev.filter(r => r.id !== id))
    if (expanded === id) setExpanded(null)
  }

  function formatDate(iso) {
    const d = new Date(iso)
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Receipts</h2>

      {receipts.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-12">No receipts scanned yet.</p>
      )}

      <ul className="space-y-3">
        {receipts.map(r => (
          <li key={r.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{r.store_name ?? 'Receipt'}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(r.scanned_at)} · {r.item_count} item{r.item_count !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  {expanded === r.id ? 'Hide' : 'View'}
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>

            {expanded === r.id && r.raw_text && (
              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                <p className="text-xs font-medium text-gray-500 mb-2">Raw OCR text</p>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {r.raw_text}
                </pre>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
