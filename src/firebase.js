// src/firebase.js
import { initializeApp } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// CRA / Vite 両対応で env を読む（import時に落ちないように安全に）
const viteEnv =
  (typeof import.meta !== "undefined" && import.meta && import.meta.env)
    ? import.meta.env
    : {};

const readEnv = (key) => {
  // Vite: import.meta.env / CRA: process.env
  return (
    (viteEnv && viteEnv[key]) ||
    (typeof process !== "undefined" && process.env && process.env[key]) ||
    ""
  );
};

// Vite名 / CRA名 どっちでも拾う
const firebaseConfig = {
  apiKey:
    readEnv("VITE_FIREBASE_API_KEY") ||
    readEnv("REACT_APP_FIREBASE_API_KEY"),
  authDomain:
    readEnv("VITE_FIREBASE_AUTH_DOMAIN") ||
    readEnv("REACT_APP_FIREBASE_AUTH_DOMAIN"),
  projectId:
    readEnv("VITE_FIREBASE_PROJECT_ID") ||
    readEnv("REACT_APP_FIREBASE_PROJECT_ID"),
  storageBucket:
    readEnv("VITE_FIREBASE_STORAGE_BUCKET") ||
    readEnv("REACT_APP_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId:
    readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") ||
    readEnv("REACT_APP_FIREBASE_MESSAGING_SENDER_ID"),
  appId:
    readEnv("VITE_FIREBASE_APP_ID") ||
    readEnv("REACT_APP_FIREBASE_APP_ID"),
};

export const firebaseConfigOk =
  !!firebaseConfig.apiKey && !!firebaseConfig.authDomain && !!firebaseConfig.projectId;

export const firebaseInitError = (() => {
  if (firebaseConfigOk) return "";
  return (
    "Firebase設定（環境変数）が不足しています。VercelのEnvironment Variablesを確認してください。\n" +
    "必要: API_KEY / AUTH_DOMAIN / PROJECT_ID など"
  );
})();

let app = null;
let auth = null;
let db = null;

// 初期化はtry/catch（ここで落ちて白画面にならないように）
try {
  if (!firebaseConfigOk) {
    console.error("[firebase] Missing env vars:", firebaseConfig);
  } else {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (e) {
  console.error("[firebase] init failed:", e);
}

// authReady: 起動直後のnull対策 + persistence(local) を確定
export const authReady = (async () => {
  if (!auth) return;
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (e) {
    console.warn("[firebase] setPersistence failed:", e);
  }
})();

export { app, auth, db };