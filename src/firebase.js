// Conexiunea la Firebase (autentificare + baza de date Firestore).
//
// Configurația web Firebase este publică prin natura ei (ajunge oricum în browserul fiecărui
// vizitator); datele sunt protejate de regulile Firestore (firestore.rules) și de lista de
// domenii permise din Firebase → Authentication → Settings → Authorized domains.
// Variabilele VITE_FIREBASE_* (din .env.local sau din setările Vercel), dacă există, au prioritate.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const env = import.meta.env;
const config = {
  apiKey: env.VITE_FIREBASE_API_KEY || "AIzaSyAOk4PqkcMF1JdrfDLdUedm-13jX5fjz4I",
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || "be-fit-from-home.firebaseapp.com",
  projectId: env.VITE_FIREBASE_PROJECT_ID || "be-fit-from-home",
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || "be-fit-from-home.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "500499473420",
  appId: env.VITE_FIREBASE_APP_ID || "1:500499473420:web:28c52be49a99af763c3a29",
};

export const firebaseReady = Boolean(config.apiKey && config.projectId && config.appId);

const app = firebaseReady ? initializeApp(config) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
