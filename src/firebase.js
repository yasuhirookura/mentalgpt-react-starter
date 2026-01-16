// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  setPersistence,
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

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * iOS Safari / PWA / アプリ切替対策
 * 成功した persistence を1つでも使う
 */
async function setupPersistence() {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
    console.log("[auth] persistence = indexedDB");
    return;
  } catch (e) {
    console.warn("[auth] indexedDB failed");
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("[auth] persistence = localStorage");
    return;
  } catch (e) {
    console.warn("[auth] localStorage failed");
  }

  await setPersistence(auth, browserSessionPersistence);
  console.warn("[auth] persistence = session (fallback)");
}

/**
 * 🔑 ここが超重要
 * persistence 設定後に auth 状態が復元された「1回目」を待つ
 */
export const authReady = (async () => {
  await setupPersistence();

  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (user) => {
      console.log("[authReady]", user ? user.uid : "no user");
      unsub();
      resolve(user);
    });
  });
})();