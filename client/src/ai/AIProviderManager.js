import registry from './providers/ProviderRegistry.js';

/**
 * AIProviderManager — tracks real-time metrics per provider.
 * Used by AIRouter to make routing decisions.
 * Singleton.
 */
class AIProviderManager {
  constructor() {
    // availability[providerId] → boolean
    this._available = {};
    // latencyHistory[providerId] → number[] (last 10 calls)
    this._latency = {};
    // errorCount[providerId] → number
    this._errors = {};
    // callCount[providerId] → number
    this._calls = {};
    // qualityScores[taskType][providerId] → number 0-100 (static initial scores)
    this._quality = {
      planning:   { gemini: 88, openai: 85, claude: 90, deepseek: 72 },
      research:   { gemini: 85, openai: 82, claude: 92, deepseek: 70 },
      finance:    { gemini: 87, openai: 86, claude: 88, deepseek: 73 },
      chart:      { gemini: 86, openai: 85, claude: 82, deepseek: 70 },
      factcheck:  { gemini: 84, openai: 83, claude: 91, deepseek: 68 },
      citation:   { gemini: 82, openai: 89, claude: 87, deepseek: 70 },
      writing:    { gemini: 85, openai: 88, claude: 93, deepseek: 72 },
    };

    // Initialize tracking for all providers
    for (const id of registry.ids()) {
      this._available[id] = true;
      this._latency[id]   = [800]; // default assumed latency ms
      this._errors[id]    = 0;
      this._calls[id]     = 0;
    }
  }

  recordSuccess(providerId, latencyMs) {
    if (!this._latency[providerId]) this._latency[providerId] = [];
    this._latency[providerId].push(latencyMs);
    if (this._latency[providerId].length > 10)
      this._latency[providerId].shift();
    this._available[providerId] = true;
    this._calls[providerId] = (this._calls[providerId] || 0) + 1;
  }

  recordFailure(providerId) {
    this._errors[providerId] = (this._errors[providerId] || 0) + 1;
    const total = (this._calls[providerId] || 0) + this._errors[providerId];
    // Mark unavailable if error rate > 50% over last 5 calls
    if (total >= 5 && this._errors[providerId] / total > 0.5)
      this._available[providerId] = false;
  }

  markAvailable(providerId, state = true) {
    this._available[providerId] = state;
  }

  isAvailable(providerId) {
    return this._available[providerId] !== false;
  }

  avgLatency(providerId) {
    const hist = this._latency[providerId];
    if (!hist || hist.length === 0) return 9999;
    return hist.reduce((a, b) => a + b, 0) / hist.length;
  }

  errorRate(providerId) {
    const e = this._errors[providerId] || 0;
    const c = this._calls[providerId] || 1;
    return e / (e + c);
  }

  qualityScore(taskType, providerId) {
    return this._quality[taskType]?.[providerId] ?? 75;
  }

  /**
   * Score a provider for a given task (higher = better).
   * Formula: quality(0.5) + reliability(0.3) + speed(0.2)
   */
  score(taskType, providerId) {
    const quality     = this.qualityScore(taskType, providerId) / 100;
    const reliability = 1 - this.errorRate(providerId);
    const speedScore  = Math.max(0, 1 - this.avgLatency(providerId) / 10000);
    return (quality * 0.5) + (reliability * 0.3) + (speedScore * 0.2);
  }

  /**
   * Returns provider IDs sorted by score for a task type.
   * Only includes available + configured providers.
   */
  rank(taskType) {
    return registry.configured()
      .map(p => p.getProviderId())
      .filter(id => this.isAvailable(id))
      .sort((a, b) => this.score(taskType, b) - this.score(taskType, a));
  }
}

export default new AIProviderManager(); // singleton
