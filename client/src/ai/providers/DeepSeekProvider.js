import BaseProvider from './BaseProvider.js';

export default class DeepSeekProvider extends BaseProvider {
  constructor() {
    super();
    this._key = import.meta.env.VITE_DEEPSEEK_API_KEY || null;
  }

  getProviderId() { return 'deepseek'; }
  getContextWindowTokens() { return 65536; }
  getEstimatedCostPer1k() { return 0.00002; } // very cost-effective
  isConfigured() { return !!this._key; }

  async generate(prompt, options = {}) {
    if (!this._key) throw new Error('DeepSeekProvider: VITE_DEEPSEEK_API_KEY not set');
    const start = Date.now();

    const res = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this._key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: options.maxTokens || 2000,
        temperature: options.temperature ?? 0.7,
      }),
    });

    if (!res.ok) throw new Error(`DeepSeek error: ${res.status}`);
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
