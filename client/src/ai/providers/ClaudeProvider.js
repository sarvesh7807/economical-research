import BaseProvider from './BaseProvider.js';

export default class ClaudeProvider extends BaseProvider {
  constructor() {
    super();
    this._key = import.meta.env.VITE_CLAUDE_API_KEY || null;
  }

  getProviderId() { return 'claude'; }
  getContextWindowTokens() { return 200000; }
  getEstimatedCostPer1k() { return 0.00025; }
  isConfigured() { return !!this._key; }
  supportsTaskType(t) { return ['research', 'writing', 'factcheck', 'citation', 'planning', 'finance', 'chart'].includes(t); }

  async generate(prompt, options = {}) {
    if (!this._key) throw new Error('ClaudeProvider: VITE_CLAUDE_API_KEY not set');
    const start = Date.now();

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this._key,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: options.maxTokens || 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) throw new Error(`Claude error: ${res.status}`);
    const data = await res.json();
    const text = data.content?.[0]?.text || '';
    const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
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
