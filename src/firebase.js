// ---------------------------------------------------------------------------
// Paste your Firebase project config below. Get this from:
// Firebase console → Project settings → General → "Your apps" → SDK setup
// (the free "Spark" plan is plenty for a fantasy league of a few dozen people)
// ---------------------------------------------------------------------------
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
