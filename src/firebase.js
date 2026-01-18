// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ✅ CRA は REACT_APP_ です（Vite の import.meta.env は使いません）
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// 変数が入ってないときは、原因が分かるように落とす（白画面防止）
const required = [
  ["REACT_APP_FIREBASE_API_KEY", firebaseConfig.apiKey],
  ["REACT_APP_FIREBASE_AUTH_DOMAIN", firebaseConfig.authDomain],
  ["REACT_APP_FIREBASE_PROJECT_ID", firebaseConfig.projectId],
  ["REACT_APP_FIREBASE_STORAGE_BUCKET", firebaseConfig.storageBucket],
  ["REACT_APP_FIREBASE_MESSAGING_SENDER_ID", firebaseConfig.messagingSenderId],
  ["REACT_APP_FIREBASE_APP_ID", firebaseConfig.appId],
];
const missing = required.filter(([, v]) => !v).map(([k]) => k);
if (missing.length) {
  // eslint-disable-next-line no-console
  console.error("[firebase] Missing env vars:", missing.join(", "));
  throw new Error(`Missing env vars: ${missing.join(", ")}`);
}

const app = initializeApp(firebaseConfig);

// ✅ Firestore
export const db = getFirestore(app);

// ✅ Auth
export const auth = getAuth(app);

// ✅ “ログイン保持” ＝ localPersistence（iOS対策で最初に一度だけ確定させる）
export const authReady = (async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn("[firebase] setPersistence failed (ignored):", e);
  }
  // 最初の onAuthStateChanged が1回返ってきたら「Auth初期化完了」
  await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, () => {
      unsub();
      resolve();
    });
  });
})();