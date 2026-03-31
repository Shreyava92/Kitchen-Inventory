import { useState } from 'react'
import { PROVIDERS, DEFAULT_SETTINGS, loadAgentSettings, saveAgentSettings, clearAgentSettings } from '../lib/aiAgent'

export default function AgentSettingsModal({ onClose }) {
  const existing = loadAgentSettings()
  const [provider, setProvider] = useState(existing?.provider ?? 'builtin')
  const [model, setModel] = useState(existing?.model ?? DEFAULT_SETTINGS.model)
  const [apiKey, setApiKey] = useState(existing?.apiKey ?? '')
  const [showKey, setShowKey] = useState(false)

  function handleProviderChange(p) {
    setProvider(p)
    setModel(PROVIDERS[p].models[0].id)
    if (p === 'builtin') setApiKey('')
  }

  function handleSave() {
    if (provider !== 'builtin' && !apiKey.trim()) return
    saveAgentSettings({ provider, model, apiKey: apiKey.trim() })
    onClose(true)
  }

  function handleDisable() {
    clearAgentSettings()
    onClose(false)
  }

  const isBuiltIn = provider === 'builtin'

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">AI Agent Settings</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose how to power receipt scanning.</p>
          </div>
          <button onClick={() => onClose(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Provider</label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(PROVIDERS).map(([key, p]) => (
              <button
                key={key}
                onClick={() => handleProviderChange(key)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border transition-colors relative ${
                  provider === key
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-green-400'
                }`}
              >
                {p.label.split(' ')[0]}
                {key === 'builtin' && (
                  <span className={`ml-1 text-[9px] ${provider === key ? 'text-green-200' : 'text-green-600'}`}>✦ free</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Built-in notice */}
        {isBuiltIn && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-3 text-xs text-green-700 space-y-1">
            <p className="font-medium">🚀 No API key needed</p>
            <p>Powered by Gemini 2.0 Flash. Works instantly — just tap Save.</p>
          </div>
        )}

        {/* Model (only non-builtin) */}
        {!isBuiltIn && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Model</label>
            <select
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {PROVIDERS[provider].models.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* API Key (only non-builtin) */}
        {!isBuiltIn && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder={`Paste your ${PROVIDERS[provider].label} API key`}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm pr-16 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Stored locally, never sent to our servers.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <button
            onClick={handleSave}
            disabled={!isBuiltIn && !apiKey.trim()}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium"
          >
            Save & Enable
          </button>
          {existing && (
            <button
              onClick={handleDisable}
              className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg px-4 py-2 text-sm font-medium"
            >
              Disable
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
