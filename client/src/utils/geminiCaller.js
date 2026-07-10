// client/src/utils/geminiCaller.js
// Shared Gemini caller with key rotation + retry logic

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4
].filter(Boolean);

let keyIndex = 0;

/**
 * Call the Gemini API with automatic key rotation and retry on rate-limit (429).
 * @param {string} prompt - The prompt to send.
 * @param {number} maxTokens - Max output tokens (default 2000).
 * @returns {Promise<string|null>} The text response or null if all attempts fail.
 */
export const callGemini = async (prompt, maxTokens = 2000) => {
  const totalKeys = GEMINI_KEYS.length;
  if (totalKeys === 0) {
    console.error('No Gemini API keys configured.');
    return null;
  }

  let attempts = 0;

  while (attempts < totalKeys * 2) {
    const key = GEMINI_KEYS[keyIndex % totalKeys];
    keyIndex++;
    attempts++;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              maxOutputTokens: maxTokens,
              temperature: 0.7
            }
          })
        }
      );

      if (res.status === 429) {
        // Rate limited — wait and try next key
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }

      if (res.status === 404) {
        // Model not found on this key — try next
        continue;
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.error('Gemini error:', errData?.error?.message || res.status);
        continue;
      }

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text && text.length > 10) {
        return text;
      }

    } catch (e) {
      console.error('Gemini call failed:', e);
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  console.error('All Gemini keys exhausted or failed.');
  return null;
};

/**
 * Parse JSON from a Gemini text response.
 * Tries to extract a JSON array first, then a JSON object.
 * @param {string|null} text - The raw text from Gemini.
 * @returns {any|null} Parsed JSON or null.
 */
export const parseGeminiJSON = (text) => {
  if (!text) return null;
  try {
    // Try array first
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) return JSON.parse(arrayMatch[0]);
    // Try object
    const objMatch = text.match(/\{[\s\S]*\}/);
    if (objMatch) return JSON.parse(objMatch[0]);
    return null;
  } catch (e) {
    console.error('JSON parse failed:', e);
    return null;
  }
};
