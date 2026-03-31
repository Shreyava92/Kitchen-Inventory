import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { LOCATION_TYPES } from '../lib/constants'

export default function LocationsPage() {
  const { household } = useAuth()
  const [locations, setLocations] = useState([])
  const [name, setName] = useState('')
  const [type, setType] = useState('cabinet')
  const [editId, setEditId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editType, setEditType] = useState('')
  const [error, setError] = useState(null)

  useEffect(() => { fetchLocations() }, [household])

  async function fetchLocations() {
    const { data } = await supabase
      .from('locations')
      .select('*')
      .eq('household_id', household.id)
      .order('name')
    setLocations(data ?? [])
  }

  async function handleAdd(e) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase
      .from('locations')
      .insert({ name: name.trim(), type, household_id: household.id })
    if (error) { setError(error.message); return }
    setName('')
    setType('cabinet')
    fetchLocations()
  }

  async function handleSaveEdit(id) {
    await supabase
      .from('locations')
      .update({ name: editName.trim(), type: editType })
      .eq('id', id)
    setEditId(null)
    fetchLocations()
  }

  async function handleDelete(id) {
    await supabase.from('locations').delete().eq('id', id)
    fetchLocations()
  }

  function startEdit(loc) {
    setEditId(loc.id)
    setEditName(loc.name)
    setEditType(loc.type)
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Locations</h2>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          required
          placeholder="Location name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          {LOCATION_TYPES.map(t => (
            <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 py-2 text-sm font-medium"
        >
          Add
        </button>
      </form>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <ul className="space-y-2">
        {locations.map(loc => (
          <li key={loc.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-3">
            {editId === loc.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={editType}
                  onChange={e => setEditType(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {LOCATION_TYPES.map(t => (
                    <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <button onClick={() => handleSaveEdit(loc.id)} className="text-sm text-green-600 font-medium">Save</button>
                <button onClick={() => setEditId(null)} className="text-sm text-gray-500">Cancel</button>
              </>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">{loc.name}</span>
                  <span className="ml-2 text-xs text-gray-400">{loc.type.charAt(0).toUpperCase() + loc.type.slice(1)}</span>
                </div>
                <button onClick={() => startEdit(loc)} className="text-sm text-gray-500 hover:text-gray-700">Edit</button>
                <button onClick={() => handleDelete(loc.id)} className="text-sm text-red-500 hover:text-red-700">Delete</button>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
