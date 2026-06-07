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

// Validate if config has valid entries (not empty and not placeholder)
const isFirebaseConfigured = 
  firebaseConfig.apiKey && 
  firebaseConfig.apiKey.trim() !== '' &&
  !firebaseConfig.apiKey.includes('YAHAN') &&
  !firebaseConfig.apiKey.includes('CONFIG');

let app = null;
let auth = null;
let googleProvider = null;
let db = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    db = getFirestore(app);
    console.log('Firebase and Firestore successfully initialized.');
  } catch (error) {
    console.error('Error initializing Firebase:', error.message);
  }
} else {
  console.warn('Firebase credentials not set or placeholder. Utilizing local simulated auth state.');
}

export { auth, googleProvider, db, isFirebaseConfigured };
export default app;
