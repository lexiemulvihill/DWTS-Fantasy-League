export const firebaseConfig = {
  apiKey: "AIzaSyBIrTs2L-ZeuUlTf9Df4JuvMuch0UbLTTU",
  authDomain: "dwts-fantasy-league-szn35.firebaseapp.com",
  projectId: "dwts-fantasy-league-szn35",
  storageBucket: "dwts-fantasy-league-szn35.firebasestorage.app",
  messagingSenderId: "748572809469",
  appId: "1:748572809469:web:3bc7205e02e4d9169a8694",
};

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
