/**
 * ApiClient — centralized fetch wrapper with API versioning.
 * Current impl: direct fetch with version header.
 * Future swap: Add base URL switch for server-side AI proxy — one file change.
 */
const API_VERSION = '2026-07-01';

class ApiClient {
  constructor() {
    this._baseUrl = ''; // empty = same origin; set to proxy URL when backend added
  }

  async request(path, options = {}) {
    const url = `${this._baseUrl}${path}`;
    const headers = {
      'Content-Type': 'application/json',
      'API-Version': API_VERSION,
      ...options.headers,
    };
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) throw new Error(`ApiClient: ${res.status} ${res.statusText} for ${path}`);
    return res.json();
  }

  get(path, opts)      { return this.request(path, { method: 'GET', ...opts }); }
  post(path, body, opts) {
    return this.request(path, { method: 'POST', body: JSON.stringify(body), ...opts });
  }
}

export default new ApiClient();
