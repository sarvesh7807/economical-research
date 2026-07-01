import { db } from '../../lib/firebase.js';
import { doc, setDoc, getDoc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * JobQueueAdapter — manages research jobs with Firestore real-time updates.
 * Current impl: Firestore onSnapshot.
 * Future swap: Inngest / BullMQ via a thin /api/jobs endpoint — interface stays identical.
 */
class JobQueueAdapter {
  /**
   * Create a new job record.
   * @param {string} userId
   * @param {string} jobType
   * @param {object} payload
   * @returns {Promise<{jobId: string}>}
   */
  async enqueue(userId, jobType, payload) {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const ref = doc(db, 'research_jobs', userId, 'jobs', jobId);
    await setDoc(ref, {
      id: jobId,
      type: jobType,
      status: 'queued',
      agentProgress: {},
      payload,
      startedAt: serverTimestamp(),
      completedAt: null,
      reportId: null,
      errorMessage: null,
    });
    return { jobId };
  }

  /**
   * Update job status.
   * @param {string} userId @param {string} jobId @param {object} updates
   */
  async update(userId, jobId, updates) {
    try {
      const ref = doc(db, 'research_jobs', userId, 'jobs', jobId);
      await updateDoc(ref, { ...updates });
    } catch {}
  }

  /** @returns {Promise<object|null>} */
  async getStatus(userId, jobId) {
    try {
      const snap = await getDoc(doc(db, 'research_jobs', userId, 'jobs', jobId));
      return snap.exists() ? snap.data() : null;
    } catch { return null; }
  }

  /**
   * Subscribe to live job updates.
   * @param {string} userId @param {string} jobId @param {function} callback
   * @returns {function} unsubscribe
   */
  subscribeToJob(userId, jobId, callback) {
    if (!userId || !jobId) return () => {};
    const ref = doc(db, 'research_jobs', userId, 'jobs', jobId);
    return onSnapshot(ref, snap => {
      if (snap.exists()) callback(snap.data());
    }, () => {});
  }
}

export default new JobQueueAdapter();
