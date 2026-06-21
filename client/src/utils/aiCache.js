import { db } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const hashText = (str) => {
  if (!str) return 'empty';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

export const getCachedOrFetchAI = async (cacheKey, fetchFunction) => {
  const cacheRef = doc(db, 'ai_cache', cacheKey);
  const cached = await getDoc(cacheRef);
  
  if (cached.exists()) {
    const data = cached.data();
    const ageInHours = (Date.now() - data.timestamp) / 3600000;
    if (ageInHours < 24) {
      return { content: data.content, fromCache: true };
    }
  }
  
  const result = await fetchFunction();
  
  await setDoc(cacheRef, {
    content: result,
    timestamp: Date.now()
  });
  
  return { content: result, fromCache: false };
};
