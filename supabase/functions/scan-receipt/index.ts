const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Always return 200 so the client can read the actual error message
function ok(body: object) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

const SYSTEM_PROMPT = `You are an inventory cataloging assistant. Analyze this image — it may be a grocery receipt, a photo of products, a shelf, or individual items.

Extract every purchasable item and return ONLY a valid JSON array. No markdown, no explanation, just the array.

Each item must follow this exact shape:
{
  "name": "Item Name (title case, concise, strip SKU codes and store prefixes like FS/SM)",
  "quantity": <number or null>,
  "unit": <one of: "count","dozen","lbs","oz","g","kg","ml","L","gal","cups","tbsp","tsp","scoops","servings","bags","boxes","cans","bottles","jars","packets">,
  "category": <one of: "food","supplement","beverage","other">,
  "subcategory": <for food: one of "dairy","produce","meat & seafood","grains & bread","sauces & condiments","snacks","canned & jarred","frozen","spices & seasonings","other"; for other: one of "clothing","medicine","toiletries","other"; for supplement/beverage: null>
}

Rules:
- If quantity is not visible, set to null
- Pick the most specific subcategory possible
- Ignore non-item lines on receipts (totals, taxes, store info, cashier, points, bags)
- For clothing use category "other" subcategory "clothing"
- For medicine/pharmacy use category "other" subcategory "medicine"
- For toiletries/personal care use category "other" subcategory "toiletries"`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  if (!req.headers.get('Authorization')) {
    return ok({ error: 'Unauthorized — missing auth header' })
  }

  if (!GEMINI_KEY) {
    return ok({ error: 'GEMINI_API_KEY secret is not set on the server' })
  }

  try {
    const { image, mimeType } = await req.json()

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mimeType ?? 'image/jpeg', data: image } },
            { text: SYSTEM_PROMPT },
          ],
        }],
        generationConfig: { maxOutputTokens: 4096 },
      }),
    })

    const geminiData = await geminiRes.json()

    if (!geminiRes.ok) {
      return ok({ error: geminiData.error?.message ?? `Gemini error ${geminiRes.status}` })
    }

    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return ok({ error: 'Gemini returned no content' })

    return ok({ text })
  } catch (err) {
    return ok({ error: err.message ?? 'Unknown error' })
  }
})
