import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function MembersPage() {
  const { household } = useAuth()
  const [inviteCode, setInviteCode] = useState('')
  const [members, setMembers] = useState([])
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const [{ data: hh }, { data: mm }] = await Promise.all([
        supabase.from('households').select('invite_code').eq('id', household.id).single(),
        supabase.from('household_members').select('email, user_id').eq('household_id', household.id),
      ])
      setInviteCode(hh?.invite_code ?? '')
      setMembers(mm ?? [])
    }
    load()
  }, [household.id])

  function copyCode() {
    navigator.clipboard.writeText(inviteCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Members</h2>

      <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <p className="text-sm font-medium text-gray-700">Invite code</p>
        <p className="text-xs text-gray-500">Share this code with anyone you want to add to <span className="font-medium">{household.name}</span>.</p>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono font-bold tracking-widest text-gray-900">{inviteCode}</span>
          <button
            onClick={copyCode}
            className="text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 font-medium"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        <ul className="space-y-2">
          {members.map(m => (
            <li key={m.user_id} className="text-sm text-gray-700 flex items-center gap-2">
              <span className="w-7 h-7 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-medium shrink-0">
                {(m.email?.[0] ?? '?').toUpperCase()}
              </span>
              {m.email ?? 'Unknown'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
