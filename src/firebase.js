// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  initializeAuth,
  indexedDBLocalPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBG3jGtcLYsYt2X6Zem-W0-r5BdQR14XTI",
  authDomain: "mentalgpt-19189.firebaseapp.com",
  projectId: "mentalgpt-19189",
  storageBucket: "mentalgpt-19189.firebasestorage.app",
  messagingSenderId: "159888180556",
  appId: "1:159888180556:web:6bbc310de7dcb716847be9",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * ✅ ここが重要：
 * initializeAuth に「優先順で persistence を配列指定」するのが安定。
 * - まず IndexedDB
 * - ダメなら localStorage
 * - 最後の逃げとして session（※これに落ちると“落ちやすい”のでログで分かるようにする）
 */
function initAuth() {
  try {
    const a = initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence],
    });
    console.log("[auth] persistence candidates = indexedDB -> localStorage");
    return a;
  } catch (e1) {
    console.warn("[auth] initializeAuth(indexedDB/local) failed:", e1);

    // フォールバック（session）
    const a = initializeAuth(app, {
      persistence: [browserLocalPersistence, browserSessionPersistence],
    });
    console.log("[auth] persistence candidates = localStorage -> session");
    return a;
  }
}

export const auth = initAuth();

/**
 * ✅ authReady:
 * 「復元が一度確定する」まで待つ
 */
export const authReady = new Promise((resolve) => {
  const unsub = onAuthStateChanged(auth, (u) => {
    console.log("[authReady] user =", u ? ${u.uid} / ${u.email || ""} : "null");
    unsub();
    resolve(u);
  });
});