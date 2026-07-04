// client/src/utils/LearningTracker.js
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, setDoc, doc, addDoc } from 'firebase/firestore';

export const trackUserResearch = async (userId, topic) => {
  if (!userId || userId === 'guest') return;
  try {
    const q = query(
      collection(db, 'user_learning_profiles'),
      where('userId', '==', userId)
    );
    const snap = await getDocs(q);
    
    let profileData = {
      userId,
      topicsResearched: [],
      topicsCount: {},
      expertiseLevel: 'beginner',
      lastActive: new Date(),
      totalResearches: 0
    };
    
    let docId = null;
    
    if (!snap.empty) {
      const docSnap = snap.docs[0];
      profileData = docSnap.data();
      docId = docSnap.id;
    }
    
    // Normalize topic
    const norm = topic.trim();
    if (!norm) return;
    
    // Ensure lists are initialized
    profileData.topicsResearched = profileData.topicsResearched || [];
    profileData.topicsCount = profileData.topicsCount || {};
    
    // Update counts
    if (!profileData.topicsResearched.includes(norm)) {
      profileData.topicsResearched.push(norm);
    }
    
    profileData.topicsCount[norm] = (profileData.topicsCount[norm] || 0) + 1;
    profileData.totalResearches = (profileData.totalResearches || 0) + 1;
    profileData.lastActive = new Date();
    
    // Expertise level logic
    if (profileData.totalResearches > 10) {
      profileData.expertiseLevel = 'advanced';
    } else if (profileData.totalResearches > 3) {
      profileData.expertiseLevel = 'intermediate';
    } else {
      profileData.expertiseLevel = 'beginner';
    }
    
    if (docId) {
      await setDoc(doc(db, 'user_learning_profiles', docId), profileData);
    } else {
      await addDoc(collection(db, 'user_learning_profiles'), profileData);
    }
  } catch (err) {
    console.error('Failed to track user research:', err);
  }
};
