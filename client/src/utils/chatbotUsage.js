import { doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const checkMessageLimit = async (user, subscription) => {
  const isPro = subscription?.tier === 'PRO' || 
                subscription?.tier === 'SCHOLAR' || 
                subscription?.tier === 'ENTERPRISE';

  if (user) {
    if (isPro) {
      return { allowed: true, remaining: 'unlimited' };
    }
    
    try {
      const usageDoc = await getDoc(doc(db, 'chatbot_usage', user.uid));
      const count = usageDoc.exists() ? usageDoc.data().messageCount : 0;
      
      if (count >= 21) {
        return { allowed: false, remaining: 0 };
      }
      return { allowed: true, remaining: 21 - count };
    } catch (error) {
      console.error("Error checking Firestore message limit:", error);
      return { allowed: true, remaining: 21 }; 
    }
  } else {
    // Guest user - check localStorage
    const count = parseInt(localStorage.getItem('chatbotMessageCount') || '0', 10);
    
    if (count >= 21) {
      return { allowed: false, remaining: 0 };
    }
    
    return { allowed: true, remaining: 21 - count };
  }
};

export const incrementMessageCount = async (user) => {
  if (user) {
    try {
      const usageRef = doc(db, 'chatbot_usage', user.uid);
      const usageDoc = await getDoc(usageRef);
      
      if (usageDoc.exists()) {
        await updateDoc(usageRef, {
          messageCount: increment(1)
        });
      } else {
        await setDoc(usageRef, {
          messageCount: 1,
          lastResetDate: new Date()
        });
      }
    } catch (error) {
      console.error("Error incrementing Firestore message count:", error);
    }
  } else {
    // Guest user
    const count = parseInt(localStorage.getItem('chatbotMessageCount') || '0', 10);
    localStorage.setItem('chatbotMessageCount', (count + 1).toString());
  }
};
