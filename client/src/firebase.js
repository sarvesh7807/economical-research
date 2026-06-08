import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

let isFirebaseConfigured = false;
let app = null;
let auth = null;
let googleProvider = null;
let db = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.apiKey.trim() !== '') {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    isFirebaseConfigured = true;
    console.log('Firebase and Firestore successfully initialized.');
  } else {
    console.warn('Firebase configuration API key is missing or empty.');
  }
} catch (error) {
  console.error('Error initializing Firebase:', error.message);
}

export { auth, googleProvider, db, isFirebaseConfigured };
export default app;
