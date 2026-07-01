import BaseProvider from './BaseProvider.js';

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];
const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export default class GeminiProvider extends BaseProvider {
  constructor() {
    super();
    this._keys = [
      import.meta.env.VITE_GEMINI_API_KEY,
      import.meta.env.VITE_GEMINI_API_KEY_2,
      import.meta.env.VITE_GEMINI_API_KEY_3,
      import.meta.env.VITE_GEMINI_API_KEY_4,
    ].filter(Boolean);
    this._keyIndex = 0;
  }

  getProviderId() { return 'gemini'; }
  getContextWindowTokens() { return 1048576; }
  getEstimatedCostPer1k() { return 0.00015; }
  isConfigured() { return this._keys.length > 0; }

  _nextKey() {
    if (this._keys.length === 0) return null;
    const key = this._keys[this._keyIndex % this._keys.length];
    this._keyIndex++;
    return key;
  }

  async generate(prompt, options = {}) {
    const maxTokens = options.maxTokens || 2000;
    const start = Date.now();

    for (let attempt = 0; attempt < this._keys.length * GEMINI_MODELS.length; attempt++) {
      const key = this._nextKey();
      if (!key) break;
      const model = GEMINI_MODELS[Math.floor(attempt / this._keys.length) % GEMINI_MODELS.length];

      try {
        const res = await fetch(`${BASE_URL}/${model}:generateContent?key=${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: options.temperature ?? 0.7 },
          }),
        });

        if (res.status === 429) continue; // rate limited — try next key
        if (!res.ok) continue;

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const tokensUsed = (data.usageMetadata?.totalTokenCount) || Math.ceil(text.length / 4);

        return { text, tokensUsed, latencyMs: Date.now() - start };
      } catch {
        continue;
      }
    }
    throw new Error('GeminiProvider: all keys exhausted or rate limited');
  }

  async healthCheck() {
    if (!this.isConfigured()) return false;
    try {
      const result = await this.generate('Say "ok"', { maxTokens: 5 });
      return result.text.length > 0;
    } catch {
      return false;
    }
  }
}
