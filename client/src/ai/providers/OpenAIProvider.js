import BaseProvider from './BaseProvider.js';

export default class OpenAIProvider extends BaseProvider {
  constructor() {
    super();
    this._key = import.meta.env.VITE_OPENAI_API_KEY || null;
  }

  getProviderId() { return 'openai'; }
  getContextWindowTokens() { return 128000; }
  getEstimatedCostPer1k() { return 0.00015; }
  isConfigured() { return !!this._key; }
  supportsTaskType(t) { return ['citation', 'writing', 'planning', 'chart', 'finance', 'factcheck', 'research'].includes(t); }

  async generate(prompt, options = {}) {
    if (!this._key) throw new Error('OpenAIProvider: VITE_OPENAI_API_KEY not set');
    const start = Date.now();

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this._key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';
    const tokensUsed = data.usage?.total_tokens || Math.ceil(text.length / 4);
    return { text, tokensUsed, latencyMs: Date.now() - start };
  }

  async healthCheck() {
    if (!this.isConfigured()) return false;
    try {
      const r = await this.generate('Say "ok"', { maxTokens: 5 });
      return r.text.length > 0;
    } catch { return false; }
  }
}
