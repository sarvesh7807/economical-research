import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBdIUZeel6FclteVnnxWbW3_fT24qqv7Nk",
  authDomain: "propane-avatar-476809-q2.firebaseapp.com",
  projectId: "propane-avatar-476809-q2",
  storageBucket: "propane-avatar-476809-q2.firebasestorage.app",
  messagingSenderId: "199913414397",
  appId: "1:199913414397:web:83cef26b2fd2db59832894"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
export const db = getFirestore(app);
export const isFirebaseConfigured = true;

export default app;
