import GeminiProvider from './GeminiProvider.js';
import OpenAIProvider from './OpenAIProvider.js';
import ClaudeProvider from './ClaudeProvider.js';
import DeepSeekProvider from './DeepSeekProvider.js';

/**
 * ProviderRegistry — singleton holding all registered AI providers.
 * Adding a new provider: instantiate, call ProviderRegistry.register(id, instance).
 * Zero changes needed anywhere else.
 */
class ProviderRegistry {
  constructor() {
    this._providers = new Map();
    this._registerDefaults();
  }

  _registerDefaults() {
    this.register('gemini',   new GeminiProvider());
    this.register('openai',   new OpenAIProvider());
    this.register('claude',   new ClaudeProvider());
    this.register('deepseek', new DeepSeekProvider());
  }

  /** @param {string} id @param {import('./BaseProvider').default} provider */
  register(id, provider) {
    this._providers.set(id, provider);
  }

  /** @returns {import('./BaseProvider').default | undefined} */
  get(id) { return this._providers.get(id); }

  /** @returns {string[]} */
  ids() { return [...this._providers.keys()]; }

  /** @returns {Array<import('./BaseProvider').default>} */
  all() { return [...this._providers.values()]; }

  /**
   * Return only providers that have API keys configured.
   * @returns {Array<import('./BaseProvider').default>}
   */
  configured() {
    return this.all().filter(p => typeof p.isConfigured === 'function' ? p.isConfigured() : true);
  }
}

export default new ProviderRegistry(); // singleton
