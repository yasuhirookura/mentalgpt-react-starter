// src/firebase.js (CRA)
import { initializeApp } from "firebase/app";
import { setLogLevel } from "firebase/app";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  inMemoryPersistence,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase SDK ログを出す（本番でも一時的にONでOK）
setLogLevel("debug");

// env（CRA は REACT_APP_ だけが注入されます）
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// 必須envチェック（欠けてたら即わかる）
const requiredKeys = [
  "REACT_APP_FIREBASE_API_KEY",
  "REACT_APP_FIREBASE_AUTH_DOMAIN",
  "REACT_APP_FIREBASE_PROJECT_ID",
  "REACT_APP_FIREBASE_STORAGE_BUCKET",
  "REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
  "REACT_APP_FIREBASE_APP_ID",
];
const missing = requiredKeys.filter((k) => !process.env[k]);
if (missing.length) console.error("[firebase] Missing env vars:", missing);

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// デバッグで外から見れるように（あとで消してOK）
window.__MGPT_AUTH__ = auth;

async function choosePersistence() {
  // iOS Safariは状況次第で local が失敗することがある
  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("[auth] persistence = local");
    return "local";
  } catch (e1) {
    console.warn("[auth] local persistence failed:", e1);
  }

  try {
    await setPersistence(auth, browserSessionPersistence);
    console.log("[auth] persistence = session");
    return "session";
  } catch (e2) {
    console.warn("[auth] session persistence failed:", e2);
  }

  await setPersistence(auth, inMemoryPersistence);
  console.warn("[auth] persistence = memory (fallback)");
  return "memory";
}

/**
 * authReady:
 * - persistence を確定
 * - その後「最初の auth 状態確定」を待つ（ただしタイムアウトで抜ける）
 */
export const authReady = (async () => {
  const p = await choosePersistence();
  window.__MGPT_PERSISTENCE__ = p;

  return new Promise((resolve) => {
    let done = false;

    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      try { unsub && unsub(); } catch {}
      console.warn("[authReady] timeout -> continue");
      resolve();
    }, 6000);

    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        console.log("[authReady] first state:", u ? u.uid : "no user", "p=", p);
        try { unsub(); } catch {}
        resolve();
      },
      (err) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        console.warn("[authReady] onAuthStateChanged error:", err, "p=", p);
        try { unsub(); } catch {}
        resolve();
      }
    );
  });
})();

// 常時監視ログ（“スワイプ後に復元できてるか”が一発で分かる）
onAuthStateChanged(auth, (u) => {
  console.log("[auth] state changed:", u ? u.uid : "null", "p=", window.__MGPT_PERSISTENCE__);
});