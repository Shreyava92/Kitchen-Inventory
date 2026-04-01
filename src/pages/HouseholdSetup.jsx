import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { DEFAULT_LOCATIONS } from '../lib/constants'

export default function HouseholdSetup() {
  const { user, setHousehold, signOut } = useAuth()
  const [mode, setMode] = useState(() => localStorage.getItem('pending_invite_code') ? 'join' : 'create')
  const [name, setName] = useState('')
  const [memberName, setMemberName] = useState('')
  const [inviteCode, setInviteCode] = useState(() => {
    const pending = localStorage.getItem('pending_invite_code')
    if (pending) { localStorage.removeItem('pending_invite_code'); return pending }
    return ''
  })
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleCreate(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const invite_code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { data: household, error: hErr } = await supabase
      .from('households')
      .insert({ name, invite_code })
      .select()
      .single()

    if (hErr) { setError(hErr.message); setLoading(false); return }

    await supabase.from('household_members').insert({ household_id: household.id, user_id: user.id, email: user.email, name: memberName.trim() || null })

    // seed default locations
    await supabase.from('locations').insert(
      DEFAULT_LOCATIONS.map(loc => ({ ...loc, household_id: household.id }))
    )

    setHousehold(household)
    setLoading(false)
  }

  async function handleJoin(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data: household, error: hErr } = await supabase
      .from('households')
      .select()
      .eq('invite_code', inviteCode.trim().toUpperCase())
      .single()

    if (hErr || !household) { setError('Invite code not found.'); setLoading(false); return }

    const { error: mErr } = await supabase
      .from('household_members')
      .insert({ household_id: household.id, user_id: user.id, email: user.email, name: memberName.trim() || null })

    if (mErr) { setError(mErr.message); setLoading(false); return }

    setHousehold(household)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-semibold text-gray-900">Set up your household</h2>
          <button onClick={signOut} className="text-xs text-gray-400 hover:text-gray-600">Sign out</button>
        </div>
        <p className="text-sm text-gray-500 mb-6">Create a new household or join an existing one.</p>

        <div className="flex gap-2 mb-6">
          {['create', 'join'].map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null) }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                mode === m ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {m === 'create' ? 'Create' : 'Join'}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-3 mb-4">{error}</p>}

        {mode === 'create' ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                required
                placeholder="e.g. Shreya"
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Household name</label>
              <input
                type="text"
                required
                placeholder="e.g. Home, The Smiths"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              {loading ? 'Creating...' : 'Create household'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                required
                placeholder="e.g. Shreya"
                value={memberName}
                onChange={e => setMemberName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invite code</label>
              <input
                type="text"
                required
                placeholder="e.g. ABC123"
                value={inviteCode}
                onChange={e => setInviteCode(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
            >
              {loading ? 'Joining...' : 'Join household'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
