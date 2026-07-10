// client/src/utils/geminiCaller.js
// Shared Gemini caller with key rotation + retry logic

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4
].filter(Boolean)

console.log('Gemini keys available:', GEMINI_KEYS.length)

let keyIndex = 0

export const callGemini = async (prompt, maxTokens = 2000) => {

  if (GEMINI_KEYS.length === 0) {
    console.error('No Gemini API keys found!')
    return null
  }

  const totalKeys = GEMINI_KEYS.length

  for (let i = 0; i < totalKeys; i++) {
    const key = GEMINI_KEYS[(keyIndex + i) % totalKeys]

    try {
      console.log(`Trying Gemini key ${i + 1}...`)

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.7
            }
          })
        }
      )

      if (res.status === 429) {
        console.log('Key rate limited, trying next...')
        await new Promise(r => setTimeout(r, 3000))
        continue
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error('Gemini error:', err?.error?.message || res.status)
        continue
      }

      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text

      if (text) {
        keyIndex = (keyIndex + i + 1) % totalKeys
        return text
      }

    } catch (e) {
      console.error('Fetch failed:', e.message)
      continue
    }
  }

  console.error('All Gemini keys exhausted or failed.')
  return null
}

export const parseGeminiJSON = (text) => {
  if (!text) return null
  try {
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()
    const arr = cleaned.match(/\[[\s\S]*\]/)
    if (arr) return JSON.parse(arr[0])
    const obj = cleaned.match(/\{[\s\S]*\}/)
    if (obj) return JSON.parse(obj[0])
    return null
  } catch (e) {
    return null
  }
}
