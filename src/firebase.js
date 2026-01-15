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
  measurementId: "G-E70WT63FH5",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * iOS Safari 対策：
 * 1) IndexedDB を試す
 * 2) ダメなら localStorage
 * 3) それもダメなら session（最終フォールバック）
 */
async function initAuthPersistence() {
  try {
    await setPersistence(auth, indexedDBLocalPersistence);
    console.log("[auth] persistence = indexedDBLocalPersistence");
    return;
  } catch (e1) {
    console.warn("[auth] IndexedDB persistence failed", e1);
  }

  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("[auth] persistence = browserLocalPersistence");
    return;
  } catch (e2) {
    console.warn("[auth] local persistence failed", e2);
  }

  try {
    await setPersistence(auth, browserSessionPersistence);
    console.log("[auth] persistence = browserSessionPersistence");
  } catch (e3) {
    console.warn("[auth] session persistence failed", e3);
  }
}

/**
 * 起動直後に persistence を必ず確定させてから、
 * Auth 状態が 1 回確定したタイミングで resolve する。
 */
export const authReady = (async () => {
  await initAuthPersistence();

  return await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      console.log("[auth] onAuthStateChanged:", u ? u.uid : null);
      unsub();
      resolve();
    });
  });
})();