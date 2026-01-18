// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
getAuth,
onAuthStateChanged,
setPersistence,
indexedDBLocalPersistence,
browserLocalPersistence,
browserSessionPersistence,
} from "firebase/auth";

// ▼ ここはあなたの既存の設定をそのまま使ってください（値は変更しない）
const firebaseConfig = {
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

/**
* iOS Safari / プライベートブラウズ等では IndexedDB が使えない場合があるため、
* 永続化(persistence)を「IndexedDB → LocalStorage → Session」の順でフォールバックします。
*/
async function ensurePersistence() {
// 1) IndexedDB（最強）
try {
await setPersistence(auth, indexedDBLocalPersistence);
console.log("[auth] persistence = indexedDBLocalPersistence");
return;
} catch (e) {
console.warn("[auth] indexedDBLocalPersistence failed -> fallback", e);
}

// 2) LocalStorage（次点）
try {
await setPersistence(auth, browserLocalPersistence);
console.log("[auth] persistence = browserLocalPersistence");
return;
} catch (e) {
console.warn("[auth] browserLocalPersistence failed -> fallback", e);
}

// 3) Session（最後の砦：タブを閉じると消える）
try {
await setPersistence(auth, browserSessionPersistence);
console.log("[auth] persistence = browserSessionPersistence");
return;
} catch (e) {
console.error("[auth] browserSessionPersistence failed", e);
}
}

/**
* authReady:
* - persistence を先に確定させる
* - その後、Auth の初回状態（ログイン済み/未ログイン）を 1回だけ確定させる
*
* Archive.jsx / Dashboard.jsx などで `await authReady;` してから処理すると安定します。
*/
export const authReady = (async () => {
await ensurePersistence();

// 初回の auth state を 1回確定させたら resolve
await new Promise((resolve) => {
const unsub = onAuthStateChanged(auth, () => {
unsub();
resolve();
});
});
})();