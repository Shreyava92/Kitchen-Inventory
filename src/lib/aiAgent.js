const SYSTEM_PROMPT = `You are an inventory cataloging assistant. Analyze this image — it may be a grocery receipt, a photo of products, a shelf, or individual items.

Extract every purchasable item and return ONLY a valid JSON array. No markdown, no explanation, just the array.

Each item must follow this exact shape:
{
  "name": "Item Name (title case, concise, e.g. 'Whole Milk', 'Ibuprofen 200mg')",
  "quantity": <number or null>,
  "unit": <one of: "count","dozen","lbs","oz","g","kg","ml","L","gal","cups","tbsp","tsp","scoops","servings","bags","boxes","cans","bottles","jars","packets">,
  "category": <one of: "food","supplement","beverage","other">,
  "subcategory": <for food: one of "dairy","produce","meat & seafood","grains & bread","sauces & condiments","snacks","canned & jarred","frozen","spices & seasonings","other"; for other: one of "clothing","medicine","toiletries","other"; for supplement/beverage: null>
}

Rules:
- If quantity is not visible, set to null
- Pick the most specific subcategory possible
- Ignore non-item lines on receipts (totals, taxes, store info, cashier lines)
- For clothing items use category "other" and subcategory "clothing"
- For medicine/pharmacy items use category "other" and subcategory "medicine"
- For toiletries/personal care use category "other" and subcategory "toiletries"`

async function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Resize + compress image to stay under Edge Function size limits (~900KB base64)
async function compressImage(file, maxPx = 1536, quality = 0.85) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      canvas.getContext('2d').drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL('image/jpeg', quality)
      resolve({ base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' })
    }
    img.onerror = async () => {
      // fallback: no compression
      URL.revokeObjectURL(url)
      const b64 = await toBase64(file)
      resolve({ base64: b64, mimeType: file.type || 'image/jpeg' })
    }
    img.src = url
  })
}

async function callClaude(apiKey, model, base64, mimeType) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: SYSTEM_PROMPT },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Claude error ${res.status}`)
  }
  const data = await res.json()
  return data.content[0].text
}

async function callOpenAI(apiKey, model, base64, mimeType) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: SYSTEM_PROMPT },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `OpenAI error ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function callGemini(apiKey, model, base64, mimeType) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType, data: base64 } },
            { text: SYSTEM_PROMPT },
          ],
        }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    }
  )
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Gemini error ${res.status}`)
  }
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

async function callGroq(apiKey, model, base64, mimeType) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
          { type: 'text', text: SYSTEM_PROMPT },
        ],
      }],
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message ?? `Groq error ${res.status}`)
  }
  const data = await res.json()
  return data.choices[0].message.content
}

async function callBuiltIn(supabase, base64, mimeType) {
  const { data, error } = await supabase.functions.invoke('scan-receipt', {
    body: { image: base64, mimeType },
  })
  if (error) throw new Error(error.message)
  if (data.error) throw new Error(data.error)
  return data.text
}

function parseAgentResponse(text) {
  // Strip markdown code fences if present
  let cleaned = text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()

  // Extract JSON array even if surrounded by extra text
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrayMatch) cleaned = arrayMatch[0]

  // Fix trailing commas before ] or } (common LLM mistake)
  cleaned = cleaned.replace(/,\s*([\]}])/g, '$1')

  let items
  try {
    items = JSON.parse(cleaned)
  } catch {
    // Last resort: try to extract individual objects and parse them
    const objectMatches = cleaned.match(/\{[^{}]*\}/g)
    if (!objectMatches) throw new Error('Could not parse AI response as JSON')
    items = objectMatches.flatMap(s => {
      try { return [JSON.parse(s)] } catch { return [] }
    })
    if (items.length === 0) throw new Error('Could not parse AI response as JSON')
  }

  return items.map(item => ({
    name: item.name ?? '',
    quantity: item.quantity ?? 1,
    unit: item.unit ?? 'count',
    category: item.category ?? 'other',
    subcategory: item.subcategory ?? null,
    location_id: '',
  }))
}

export async function runAgent(file, settings, supabase) {
  const { provider, model, apiKey } = settings

  let text
  if (provider === 'builtin') {
    const { base64, mimeType } = await compressImage(file)
    text = await callBuiltIn(supabase, base64, mimeType)
  } else {
    const mimeType = file.type || 'image/jpeg'
    const base64 = await toBase64(file)
    if (provider === 'claude') text = await callClaude(apiKey, model, base64, mimeType)
    else if (provider === 'openai') text = await callOpenAI(apiKey, model, base64, mimeType)
    else if (provider === 'gemini') text = await callGemini(apiKey, model, base64, mimeType)
    else if (provider === 'groq') text = await callGroq(apiKey, model, base64, mimeType)
    else throw new Error('Unknown provider')
  }

  return parseAgentResponse(text)
}

export const DEFAULT_SETTINGS = { provider: 'builtin', model: 'gemini-2.5-flash', apiKey: '' }

export const PROVIDERS = {
  builtin: {
    label: 'Gemini 2.5 Flash (Built-in)',
    models: [{ id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' }],
  },
  claude: {
    label: 'Claude (Anthropic)',
    models: [
      { id: 'claude-opus-4-6', label: 'Claude Opus 4.6 (best)' },
      { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6 (fast)' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5 (cheapest)' },
    ],
  },
  openai: {
    label: 'OpenAI',
    models: [
      { id: 'gpt-4o', label: 'GPT-4o (best)' },
      { id: 'gpt-4o-mini', label: 'GPT-4o Mini (cheap)' },
    ],
  },
  gemini: {
    label: 'Google Gemini',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (best)' },
      { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite (cheaper)' },
    ],
  },
  groq: {
    label: 'Groq (Free)',
    models: [
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout (best)' },
      { id: 'llama-3.2-90b-vision-preview', label: 'Llama 3.2 90B Vision' },
      { id: 'llama-3.2-11b-vision-preview', label: 'Llama 3.2 11B Vision (fast)' },
    ],
  },
}

export function loadAgentSettings() {
  try {
    return JSON.parse(localStorage.getItem('agentSettings') ?? 'null')
  } catch {
    return null
  }
}

export function saveAgentSettings(settings) {
  localStorage.setItem('agentSettings', JSON.stringify(settings))
}

export function clearAgentSettings() {
  localStorage.removeItem('agentSettings')
}
