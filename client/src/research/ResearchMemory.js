import { db } from '../lib/firebase.js';
import {
  collection, doc, getDoc, setDoc, getDocs,
  query, where, orderBy, limit, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import vectorStore from '../ai/adapters/VectorStoreAdapter.js';
import Logger from '../utils/Logger.js';

const EXACT_CACHE_TTL_MS  = 6  * 60 * 60 * 1000; // 6 hours
const FUZZY_CACHE_TTL_MS  = 7  * 24 * 60 * 60 * 1000; // 7 days
const FUZZY_OVERLAP_THRESHOLD = 0.6; // 60% term overlap

function normalizeQuery(q) {
  return q.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\b(the|a|an|is|are|what|how|why|when|where|will|does|do|and|or|of|in|for|on|to|by)\b/g, '')
    .replace(/\s+/g, ' ').trim();
}

function extractTerms(q) {
  return [...new Set(normalizeQuery(q).split(' ').filter(t => t.length > 3))];
}

function termOverlap(termsA, termsB) {
  if (!termsA.length || !termsB.length) return 0;
  const setA = new Set(termsA);
  const common = termsB.filter(t => setA.has(t)).length;
  return common / Math.max(termsA.length, termsB.length);
}

function hashQuery(q) {
  const norm = normalizeQuery(q);
  let h = 0;
  for (let i = 0; i < norm.length; i++) {
    h = (h << 5) - h + norm.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}

class ResearchMemory {
  _col(userId) {
    if (userId) return collection(db, 'research_memory', userId, 'reports');
    return collection(db, 'research_memory_public', 'shared', 'reports');
  }

  /**
   * Find a similar past report.
   */
  async findSimilar(query, userId = null) {
    try {
      const terms = extractTerms(query);
      const hash  = hashQuery(query);
      const col   = this._col(userId);

      const exactQ = firestoreQuery(col, where('queryHash', '==', hash), limit(1));
      const exactSnap = await getDocs(exactQ);
      if (!exactSnap.empty) {
        const data = exactSnap.docs[0].data();
        const age  = Date.now() - (data.generatedAt?.toMillis?.() || 0);
        if (age < EXACT_CACHE_TTL_MS) return { ...data, isExact: true, cacheAge: age };
        if (age < FUZZY_CACHE_TTL_MS) return { ...data, isExact: false, isStale: true, cacheAge: age };
      }

      if (vectorStore.isAvailable()) {
        // Future: semantic search
      }

      const recentQ = firestoreQuery(col, orderBy('generatedAt', 'desc'), limit(20));
      const recentSnap = await getDocs(recentQ);
      for (const d of recentSnap.docs) {
        const data = d.data();
        const overlap = termOverlap(terms, data.queryTerms || []);
        if (overlap >= FUZZY_OVERLAP_THRESHOLD) {
          return { ...data, isExact: false, isFuzzy: true, overlapScore: overlap };
        }
      }

      return null;
    } catch (err) {
      Logger.warn('ResearchMemory', 'findSimilar failed', { err: err.message });
      return null;
    }
  }

  /**
   * Saves report and registers a historical version.
   * @returns {Promise<string>} reportId
   */
  async save(result, userId = null) {
    try {
      const col = this._col(userId);
      let reportId = result.reportId;
      let nextVersion = 1;

      if (reportId) {
        // Fetch existing version count
        const ref = doc(col, reportId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const current = snap.data();
          nextVersion = (current.reportVersion || 1) + 1;
        }
      } else {
        reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      }

      const mainRef = doc(col, reportId);
      const reportPayload = {
        id:             reportId,
        query:          result.query,
        queryNormalized: normalizeQuery(result.query),
        queryHash:      hashQuery(result.query),
        queryTerms:     extractTerms(result.query),
        report:         result.report || '',
        reportJson:     result.reportJson || null,
        executiveSummary: (result.report || '').slice(0, 500),
        keyStats:       result.research?.keyStats || [],
        charts:         result.charts || [],
        citations:      result.citation?.citations || [],
        sources:        result.citation?.scoredSources || [],
        timeline:       result.timeline || {},
        factCheck:      result.factCheck || {},
        finance:        result.finance || {},
        knowledgeEntities: (result.research?.entities || []).map(e => ({ name: e })),
        aiReasoningSummary: `7-agent pipeline. Risk: ${result.finance?.riskLevel || 'N/A'}`,
        generatedAt:    serverTimestamp(),
        reportVersion:  nextVersion,
        sectionsStale:  [],
      };

      await setDoc(mainRef, reportPayload);

      // Save subcollection version history
      if (userId) {
        const versionRef = doc(db, 'research_memory', userId, 'reports', reportId, 'versions', `v${nextVersion}`);
        await setDoc(versionRef, {
          version: nextVersion,
          savedAt: Date.now(),
          ...reportPayload,
          generatedAt: Date.now(),
        });
      }
      
      // Save to global report_versions collection (FEATURE 6)
      try {
        await addDoc(collection(db, 'report_versions'), {
          reportId: reportId,
          userId: userId || 'guest',
          version: nextVersion,
          content: result.report || '',
          savedAt: new Date(),
          query: result.query || ''
        });
      } catch (err) {
        console.error('Failed to save to report_versions collection:', err);
      }

      Logger.info('ResearchMemory', `Saved report version v${nextVersion} for ID ${reportId}`);
      return reportId;
    } catch (err) {
      Logger.error('ResearchMemory', 'save failed', { err: err.message });
      return null;
    }
  }

  /**
   * Fetch all saved versions for a report.
   * @returns {Promise<Array>} versions list
   */
  async getVersions(userId, reportId) {
    if (!userId || !reportId) return [];
    try {
      const col = collection(db, 'research_memory', userId, 'reports', reportId, 'versions');
      const q = firestoreQuery(col, orderBy('version', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } catch (err) {
      Logger.warn('ResearchMemory', 'getVersions failed', { err: err.message });
      return [];
    }
  }

  /**
   * Restore an older version.
   */
  async restoreVersion(userId, reportId, versionNumber) {
    if (!userId || !reportId) return null;
    try {
      const versionRef = doc(db, 'research_memory', userId, 'reports', reportId, 'versions', `v${versionNumber}`);
      const snap = await getDoc(versionRef);
      if (!snap.exists()) return null;

      const versionData = snap.data();
      const mainRef = doc(this._col(userId), reportId);
      
      // Update main document to match restored version
      const restoredPayload = {
        ...versionData,
        generatedAt: serverTimestamp(),
        reportVersion: versionNumber, // Keep version number
      };
      delete restoredPayload.savedAt;

      await setDoc(mainRef, restoredPayload);
      return restoredPayload;
    } catch (err) {
      Logger.error('ResearchMemory', 'restoreVersion failed', { err: err.message });
      return null;
    }
  }

  /** @returns {Promise<Array>} */
  async getHistory(userId, maxItems = 20) {
    if (!userId) return [];
    try {
      const q = firestoreQuery(this._col(userId), orderBy('generatedAt', 'desc'), limit(maxItems));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  }

  async updateSection(userId, reportId, sectionName, data) {
    try {
      const ref = doc(this._col(userId), reportId);
      await updateDoc(ref, {
        [sectionName]: data,
        [`sectionTimestamps.${sectionName}`]: Date.now(),
        sectionsStale: [],
      });
    } catch {}
  }

  /**
   * Save a public shared copy of a report.
   */
  async savePublicReport(slug, reportPayload) {
    try {
      const publicRef = doc(db, 'research_memory_public', 'shared', 'reports', slug);
      const cleanPayload = {
        ...reportPayload,
        generatedAt: reportPayload.generatedAt?.toMillis ? reportPayload.generatedAt.toMillis() : (reportPayload.generatedAt || Date.now()),
      };
      await setDoc(publicRef, cleanPayload);
      Logger.info('ResearchMemory', `Saved public report under slug: ${slug}`);
      return slug;
    } catch (err) {
      Logger.error('ResearchMemory', 'savePublicReport failed', { err: err.message });
      return null;
    }
  }

  /**
   * Fetch a public shared report by its slug.
   */
  async getPublicReport(slug) {
    try {
      const publicRef = doc(db, 'research_memory_public', 'shared', 'reports', slug);
      const snap = await getDoc(publicRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (err) {
      Logger.error('ResearchMemory', 'getPublicReport failed', { err: err.message });
      return null;
    }
  }
}

const firestoreQuery = query;
export default new ResearchMemory();
