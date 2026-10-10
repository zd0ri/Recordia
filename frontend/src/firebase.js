import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithFirebaseEmail = (email, password) =>
  signInWithEmailAndPassword(firebaseAuth, email, password);

export const registerWithFirebaseEmail = (email, password) =>
  createUserWithEmailAndPassword(firebaseAuth, email, password);

export const updateFirebaseUserProfile = (user, profile) =>
  updateProfile(user, profile);

export const signInWithFirebaseGoogle = () =>
  signInWithPopup(firebaseAuth, googleProvider);
