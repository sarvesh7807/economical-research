const KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4
].filter(k => k && k.length > 10)

let idx = 0

export async function callGemini(prompt, tokens = 2000) {
  if (!KEYS.length) {
    console.error('NO GEMINI KEYS FOUND')
    return null
  }
  
  for (let attempt = 0; attempt < KEYS.length * 2; attempt++) {
    const key = KEYS[idx % KEYS.length]
    idx++
    
    for (const model of [
      'gemini-2.0-flash-exp',
      'gemini-2.0-flash',
      'gemini-1.5-flash-latest',
      'gemini-2.5-flash'
    ]) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              contents: [{parts: [{text: prompt}]}],
              generationConfig: {maxOutputTokens: tokens}
            })
          }
        )
        
        if (r.status === 429) {
          await new Promise(res => setTimeout(res, 5000))
          break
        }
        
        if (r.status === 404) continue
        
        if (!r.ok) {
          const e = await r.json()
          console.error('API error:', e?.error?.message)
          continue
        }
        
        const d = await r.json()
        const text = d?.candidates?.[0]?.content?.parts?.[0]?.text
        if (text?.length > 5) return text
        
      } catch(e) {
        console.error('Fetch error:', e.message)
      }
    }
    
    await new Promise(res => setTimeout(res, 8000))
  }
  
  console.error('All Gemini attempts failed')
  return null
}

export function parseGeminiJSON(text) {
  if (!text) return null
  try {
    const c = text.replace(/```json/gi,'').replace(/```/g,'').trim()
    const a = c.match(/\[[\s\S]*\]/)
    if (a) return JSON.parse(a[0])
    const o = c.match(/\{[\s\S]*\}/)
    if (o) return JSON.parse(o[0])
  } catch(e) {
    console.error('JSON parse error:', e.message)
  }
  return null
}
