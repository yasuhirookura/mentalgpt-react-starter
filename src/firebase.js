// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
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

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * 🔐 Auth 永続化 & 初期化待ち
 * - iOS Safariでタブが落ちても復元されやすい
 * - 「一瞬ログアウト扱い」を防ぐ
 */
export const authReady = (async () => {
  try {
    // ① 永続化を明示的に指定（重要）
    await setPersistence(auth, indexedDBLocalPersistence);
  } catch (e) {
    // IndexedDB がダメな場合の保険
    console.warn("IndexedDB persistence failed, fallback to localStorage", e);
    await setPersistence(auth, browserLocalPersistence);
  }

  // ② Firebase Auth の復元完了を待つ
  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });
})();