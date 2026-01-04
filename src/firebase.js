// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBG3jGtcLYsYt2X6Zem-W0-r5BdQR14XTI",
  authDomain: "mentalgpt-19189.firebaseapp.com",
  projectId: "mentalgpt-19189",
  storageBucket: "mentalgpt-19189.firebasestorage.app",
  messagingSenderId: "159888180556",
  appId: "1:159888180556:web:6bbc310de7dcb716847be9",
  measurementId: "G-E70WT63FH5",
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  // iOS Safariなどで localStorage が不安定でも IndexedDB に逃げられる
  persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});

export const db = getFirestore(app);

// 起動直後の「一瞬ログアウト扱い」を避けるため、Auth初期化を待つ
export const authReady = new Promise((resolve) => {
  const unsubscribe = onAuthStateChanged(auth, () => {
    unsubscribe();
    resolve();
  });
});
