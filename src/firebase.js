// src/firebase.js
import { initializeApp } from "firebase/app";
import {
initializeAuth,
indexedDBLocalPersistence,
browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBG3jGtcLYsYt2X6Zem-W0-r5BdQR14XTI",
  authDomain: "mentalgpt-19189.firebaseapp.com",
  projectId: "mentalgpt-19189",
  storageBucket: "mentalgpt-19189.firebasestorage.app",
  messagingSenderId: "159888180556",
  appId: "1:159888180556:web:6bbc310de7dcb716847be9",
  measurementId: "G-E70WT63FH5"
};

//
// ✅ Firebase 初期化
//
const app = initializeApp(firebaseConfig);

//
// ✅ 永続ログイン設定（ブラウザ再起動してもログイン保持）
//
export const auth = initializeAuth(app, {
persistence: [indexedDBLocalPersistence, browserLocalPersistence],
});

//
// ✅ Firestore（DB）
//
export const db = getFirestore(app);

//
// ✅ Auth 初期化完了を保証する Promise
// → 起動直後の「一瞬ログアウト扱い」を防ぐ
//
export const authReady = new Promise((resolve) => {
const unsubscribe = auth.onAuthStateChanged(() => {
unsubscribe(); // 一度だけ実行
resolve();
});
});