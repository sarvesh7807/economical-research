import { db } from '../../lib/firebase.js';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

/**
 * CacheAdapter — key/value cache with TTL.
 * Current impl: Firestore `ai_cache` collection.
 * Future swap: Replace get/set with Upstash Redis calls — zero business logic change.
 */
class CacheAdapter {
  /** @param {string} key @returns {Promise<string|null>} */
  async get(key) {
    try {
      const ref = doc(db, 'ai_cache', key.replace(/[^a-zA-Z0-9_-]/g, '_'));
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;
      const { value, expiresAt } = snap.data();
      if (expiresAt && Date.now() > expiresAt) {
        await deleteDoc(ref).catch(() => {});
        return null;
      }
      return value;
    } catch { return null; }
  }

  /** @param {string} key @param {string} value @param {number} ttlSeconds */
  async set(key, value, ttlSeconds = 86400) {
    try {
      const ref = doc(db, 'ai_cache', key.replace(/[^a-zA-Z0-9_-]/g, '_'));
      await setDoc(ref, {
        value,
        createdAt: Date.now(),
        expiresAt: Date.now() + (ttlSeconds * 1000),
      });
    } catch { /* cache miss is not fatal */ }
  }

  async invalidate(key) {
    try {
      await deleteDoc(doc(db, 'ai_cache', key.replace(/[^a-zA-Z0-9_-]/g, '_')));
    } catch {}
  }
}

export default new CacheAdapter();
