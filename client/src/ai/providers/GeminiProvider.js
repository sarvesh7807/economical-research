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
    const errors = [];

    for (let attempt = 0; attempt < this._keys.length * GEMINI_MODELS.length; attempt++) {
      const key = this._nextKey();
      if (!key) break;
      const model = GEMINI_MODELS[Math.floor(attempt / this._keys.length) % GEMINI_MODELS.length];

      try {
        const url = `${BASE_URL}/${model}:generateContent?key=${key}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: maxTokens, temperature: options.temperature ?? 0.7 },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
          const tokensUsed = (data.usageMetadata?.totalTokenCount) || Math.ceil(text.length / 4);
          return { text, tokensUsed, latencyMs: Date.now() - start };
        }

        // Error handling (Requirement 6 & 7)
        let errMsg = `HTTP ${res.status}`;
        try {
          const errBody = await res.json();
          if (errBody && errBody.error) {
            errMsg = `${res.status} ${errBody.error.status}: ${errBody.error.message}`;
          }
        } catch (e) {
          try {
            const txt = await res.text();
            if (txt) errMsg = `${res.status}: ${txt}`;
          } catch (e2) {}
        }

        console.error(`Gemini API Error details for model ${model}:`, errMsg);
        errors.push(`${model} -> ${errMsg}`);

        if (res.status === 429) {
          continue;
        }

        if (res.status === 400) {
          throw new Error(`400 Bad Request - ${errMsg}`);
        } else if (res.status === 401) {
          throw new Error(`401 Unauthorized - ${errMsg}`);
        } else if (res.status === 403) {
          throw new Error(`403 Permission/Quota - ${errMsg}`);
        } else if (res.status === 404) {
          throw new Error(`404 Model/Endpoint Not Found - ${errMsg}`);
        } else {
          throw new Error(`${res.status} Server Error - ${errMsg}`);
        }

      } catch (err) {
        if (err.message.includes('Bad Request') || 
            err.message.includes('Unauthorized') || 
            err.message.includes('Permission/Quota') || 
            err.message.includes('Not Found') ||
            err.message.includes('Server Error')) {
          throw err;
        }
        errors.push(`${model} -> Network/Parse error: ${err.message}`);
      }
    }
    throw new Error(`GeminiProvider: All attempts failed. Errors: ${errors.join(' | ')}`);
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
