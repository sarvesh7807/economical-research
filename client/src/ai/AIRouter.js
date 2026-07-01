import registry  from './providers/ProviderRegistry.js';
import manager   from './AIProviderManager.js';
import Logger    from '../utils/Logger.js';

/**
 * AIRouter — the ONLY entry point for all AI calls.
 *
 * Agents call: AIRouter.route(prompt, taskType, options?)
 * They never know which provider answered.
 * The UI always sees "Economical Research AI".
 */
class AIRouter {
  /**
   * @param {string} prompt
   * @param {string} taskType  planning|research|finance|chart|factcheck|citation|writing
   * @param {{ maxTokens?: number, temperature?: number }} options
   * @returns {Promise<string>} The text response
   */
  async route(prompt, taskType, options = {}) {
    const ranked = manager.rank(taskType);

    if (ranked.length === 0) {
      // Absolute fallback — try any configured provider
      const any = registry.configured();
      if (any.length === 0) throw new Error('No AI providers configured. Please set at least VITE_GEMINI_API_KEY.');
      ranked.push(...any.map(p => p.getProviderId()));
    }

    let lastError;
    for (const providerId of ranked) {
      const provider = registry.get(providerId);
      if (!provider) continue;

      try {
        Logger.info('AIRouter', `Routing ${taskType} → ${providerId}`);
        const result = await provider.generate(prompt, options);

        manager.recordSuccess(providerId, result.latencyMs);
        Logger.info('AIRouter', `${providerId} responded in ${result.latencyMs}ms (${result.tokensUsed} tokens)`);

        // Always return just the text — provider identity is never exposed
        return result.text;
      } catch (err) {
        manager.recordFailure(providerId);
        Logger.warn('AIRouter', `${providerId} failed for ${taskType}: ${err.message}`);
        lastError = err;
      }
    }

    throw new Error(`AIRouter: all providers failed for task "${taskType}". Last error: ${lastError?.message}`);
  }

  /**
   * Get availability summary — used by diagnostics/admin only.
   * Never exposes provider names to the UI.
   */
  getStatus() {
    return registry.ids().map(id => ({
      available: manager.isAvailable(id),
      avgLatencyMs: Math.round(manager.avgLatency(id)),
      errorRate: (manager.errorRate(id) * 100).toFixed(1) + '%',
    }));
  }
}

export default new AIRouter(); // singleton
