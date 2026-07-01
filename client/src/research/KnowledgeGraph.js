import { db } from '../lib/firebase.js';
import {
  doc, getDoc, setDoc, updateDoc, collection, getDocs,
  query, orderBy, limit as fsLimit, serverTimestamp,
} from 'firebase/firestore';
import Logger from '../utils/Logger.js';

const ENTITY_TYPES = ['country', 'company', 'person', 'industry', 'government',
                      'policy', 'technology', 'event', 'stock', 'commodity',
                      'indicator', 'institution'];

function slugify(name) {
  return name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').trim();
}

class KnowledgeGraph {
  /**
   * Pull existing entity context for a query to enrich agent prompts.
   * @param {string} query
   * @returns {Promise<string>} formatted context string
   */
  async enrichQuery(query) {
    try {
      const terms = query.toLowerCase().split(/\W+/).filter(t => t.length > 3);
      const col   = collection(db, 'knowledge_graph_entities');
      const snap  = await getDocs(firestoreQuery(col, orderBy('researchCount', 'desc'), fsLimit(50)));
      
      const relevant = snap.docs
        .map(d => d.data())
        .filter(e => terms.some(t => e.name?.toLowerCase().includes(t) || e.aliases?.some(a => a.toLowerCase().includes(t))))
        .slice(0, 8);

      if (!relevant.length) return '';

      return relevant.map(e =>
        `${e.type?.toUpperCase() || 'ENTITY'}: ${e.name} (research count: ${e.researchCount || 1})`
      ).join('\n');
    } catch {
      return '';
    }
  }

  /**
   * Ingest entities from a completed report into the knowledge graph.
   * @param {string[]} entityNames
   * @param {string} reportId
   */
  async ingestEntities(entityNames, reportId) {
    if (!entityNames?.length) return;
    for (const name of entityNames.slice(0, 20)) {
      try {
        const id  = slugify(name);
        const ref = doc(db, 'knowledge_graph_entities', id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          await updateDoc(ref, {
            researchCount: (snap.data().researchCount || 0) + 1,
            lastSeen: serverTimestamp(),
            reportIds: [...(snap.data().reportIds || []).slice(-19), reportId],
          });
        } else {
          await setDoc(ref, {
            id,
            name,
            type: this._guessType(name),
            aliases: [],
            properties: {},
            researchCount: 1,
            reportIds: [reportId],
            lastSeen: serverTimestamp(),
          });
        }
      } catch (err) {
        Logger.warn('KnowledgeGraph', `ingest failed for ${name}`, { err: err.message });
      }
    }
  }

  _guessType(name) {
    const n = name.toLowerCase();
    if (/reserve|central bank|ecb|fed|rbi|boe/.test(n)) return 'institution';
    if (/inc|corp|ltd|plc|llc|company|group/.test(n)) return 'company';
    if (/act|policy|regulation|law|agreement|accord/.test(n)) return 'policy';
    if (/\bgdp\b|inflation|cpi|pmi|rate|index/.test(n)) return 'indicator';
    if (/oil|gold|silver|copper|wheat|corn/.test(n)) return 'commodity';
    return 'entity';
  }

  /**
   * Get all entities for graph visualization.
   * @returns {Promise<{nodes: Array, edges: Array}>}
   */
  async getGraph(maxNodes = 80) {
    try {
      const col  = collection(db, 'knowledge_graph_entities');
      const snap = await getDocs(firestoreQuery(col, orderBy('researchCount', 'desc'), fsLimit(maxNodes)));
      const nodes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return { nodes, edges: [] };
    } catch {
      return { nodes: [], edges: [] };
    }
  }
}

const firestoreQuery = query;
export default new KnowledgeGraph();
