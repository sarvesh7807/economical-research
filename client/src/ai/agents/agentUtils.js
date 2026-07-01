/**
 * Shared utility functions for all AI agents.
 */

/**
 * Robustly parse JSON from an LLM response.
 * Handles markdown code fences, leading text, trailing noise.
 * @param {string} text
 * @returns {object|null}
 */
export function parseJsonSafely(text) {
  if (!text) return null;

  // 1. Try direct parse
  try { return JSON.parse(text.trim()); } catch {}

  // 2. Extract from ```json ... ``` block
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try { return JSON.parse(fenceMatch[1].trim()); } catch {}
  }

  // 3. Find first complete JSON object { ... }
  const objStart = text.indexOf('{');
  const objEnd   = text.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(text.slice(objStart, objEnd + 1)); } catch {}
  }

  // 4. Find first complete JSON array [ ... ]
  const arrStart = text.indexOf('[');
  const arrEnd   = text.lastIndexOf(']');
  if (arrStart !== -1 && arrEnd > arrStart) {
    try { return JSON.parse(text.slice(arrStart, arrEnd + 1)); } catch {}
  }

  return null;
}

/**
 * Truncate a string to a max character count (for prompt context windows).
 */
export function truncate(str, maxChars = 2000) {
  if (!str || str.length <= maxChars) return str;
  return str.slice(0, maxChars) + '... [truncated]';
}
