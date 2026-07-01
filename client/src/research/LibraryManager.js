import { db } from '../lib/firebase.js';
import { collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';

class LibraryManager {
  _col(userId) {
    return collection(db, 'research_library', userId, 'bookmarks');
  }

  /**
   * Save a report or section bookmark.
   */
  async saveBookmark(userId, reportData, sectionData = null) {
    if (!userId || !reportData) return null;
    try {
      const bookmarkId = sectionData
        ? `bookmark_${reportData.id}_${sectionData.id}`
        : `bookmark_${reportData.id}`;

      const ref = doc(this._col(userId), bookmarkId);
      
      const payload = {
        id:          bookmarkId,
        reportId:    reportData.id || reportData.reportId || '',
        query:       reportData.query || '',
        bookmarkedAt: Date.now(),
        isSection:   !!sectionData,
        sectionTitle: sectionData ? sectionData.title : null,
        sectionContent: sectionData ? sectionData.content : null,
        reportSummary: reportData.executiveSummary || reportData.report?.slice(0, 300) || '',
      };

      await setDoc(ref, payload);
      return bookmarkId;
    } catch (err) {
      console.error('saveBookmark failed:', err);
      return null;
    }
  }

  /**
   * Retrieve all bookmarks for a user.
   */
  async getBookmarks(userId) {
    if (!userId) return [];
    try {
      const q = query(this._col(userId), orderBy('bookmarkedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => d.data());
    } catch (err) {
      console.error('getBookmarks failed:', err);
      return [];
    }
  }

  /**
   * Delete a bookmark.
   */
  async deleteBookmark(userId, bookmarkId) {
    if (!userId || !bookmarkId) return;
    try {
      await deleteDoc(doc(this._col(userId), bookmarkId));
    } catch (err) {
      console.error('deleteBookmark failed:', err);
    }
  }
}

export default new LibraryManager();
