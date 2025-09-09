// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ← ここはあなたのコンソールの値をそのまま
  apiKey: "AIzaSyBG3jGtcLYsYt2X6Zem-W0-r5BdQR14XTI",
  authDomain: "mentalgpt-19189.firebaseapp.com",
  projectId: "mentalgpt-19189",
  storageBucket: "mentalgpt-19189.firebasestorage.app",
  messagingSenderId: "159888180556",
  appId: "1:159888180556:web:6bbc310de7dcb716847be9",
  measurementId: "G-E70WT63FH5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
// ★ 追加：ログイン状態をブラウザに保持
setPersistence(auth, browserLocalPersistence).catch(console.error);

export const db = getFirestore(app);

/*
// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  // ← ここはあなたのコンソールの値をそのまま
  apiKey: "AIzaSyBG3jGtcLYsYt2X6Zem-W0-r5BdQR14XTI",
  authDomain: "mentalgpt-19189.firebaseapp.com",
  projectId: "mentalgpt-19189",
  storageBucket: "mentalgpt-19189.firebasestorage.app",
  messagingSenderId: "159888180556",
  appId: "1:159888180556:web:6bbc310de7dcb716847be9",
  measurementId: "G-E70WT63FH5"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
