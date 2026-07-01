/**
 * BaseProvider — Abstract contract every AI provider must implement.
 * AIRouter talks ONLY to this interface. Never to provider SDKs directly.
 */
export default class BaseProvider {
  /** @returns {string} Internal provider ID — never shown in UI */
  getProviderId() { throw new Error('getProviderId() not implemented'); }

  /** @returns {string} Always "Economical Research AI" — never expose real provider */
  getDisplayName() { return 'Economical Research AI'; }

  /** @returns {number} Max context window in tokens */
  getContextWindowTokens() { return 8192; }

  /** @returns {number} Estimated USD cost per 1k output tokens */
  getEstimatedCostPer1k() { return 0.001; }

  /**
   * Whether this provider is optimised for a given task type.
   * AIRouter uses this as a soft hint, not a hard filter.
   * @param {string} taskType
   * @returns {boolean}
   */
  supportsTaskType(_taskType) { return true; }

  /**
   * Core generation method — the ONLY method agents call (via AIRouter).
   * @param {string} prompt
   * @param {{ maxTokens?: number, temperature?: number }} options
   * @returns {Promise<{ text: string, tokensUsed: number, latencyMs: number }>}
   */
  async generate(_prompt, _options = {}) {
    throw new Error('generate() not implemented');
  }

  /**
   * Lightweight availability check.
   * @returns {Promise<boolean>}
   */
  async healthCheck() { return false; }
}
