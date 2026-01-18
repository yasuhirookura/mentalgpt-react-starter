// src/firebase.js (CRA + Firebase v9 modular, iOS-friendly persistence)

import { initializeApp, getApps } from "firebase/app";
import {
getAuth,
onAuthStateChanged,
setPersistence,
indexedDBLocalPersistence,
browserLocalPersistence,
browserSessionPersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- env (CRA) ---
const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// --- basic validation ---
const missing = Object.entries(firebaseConfig)
.filter(([, v]) => !v)
.map(([k]) => k);

if (missing.length) {
console.error("[firebase] Missing env vars:", missing);
}

// --- init app (avoid double init in dev/HMR) ---
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

// --- exports ---
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
* iOS Safari は状況次第で IndexedDB が不安定なことがあるので、
* 1) indexedDB → 2) localStorage → 3) session の順でフォールバック
*
* 重要：ログイン前にこれが完了している必要がある
*/
async function ensurePersistence() {
// すでにセット済みでも害はないが、失敗時のfallbackのため毎回tryする
const candidates = [
{ name: "indexedDBLocalPersistence", value: indexedDBLocalPersistence },
{ name: "browserLocalPersistence", value: browserLocalPersistence },
{ name: "browserSessionPersistence", value: browserSessionPersistence },
];

for (const p of candidates) {
try {
await setPersistence(auth, p.value);
console.log(`[firebase] persistence set: ${p.name}`);
return p.name;
} catch (e) {
console.warn(`[firebase] persistence failed: ${p.name}`, e);
}
}

// ここまで来たらかなり異常（Cookieブロック/プライベートなど）
console.error("[firebase] Could not set any persistence.");
return null;
}

/**
* auth復元が終わったかどうかを外部から待てるようにする
*/
let _authReadyResolve;
export const authReady = new Promise((resolve) => {
_authReadyResolve = resolve;
});

// ここが超重要：起動時に必ず persistence → onAuthStateChanged の順にする
(async () => {
await ensurePersistence();

onAuthStateChanged(auth, (user) => {
// user が null でも「復元処理が終わった」ことが重要
window.__MENTALGPT_USER__ = user ? { uid: user.uid, email: user.email } : null;
_authReadyResolve(user);
});
})();