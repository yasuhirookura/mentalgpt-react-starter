// src/firebase.js (CRA)
import { initializeApp } from "firebase/app";
import {
getAuth,
setPersistence,
browserLocalPersistence,
browserSessionPersistence,
inMemoryPersistence,
onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// env（CRA は REACT_APP_ だけが注入されます）
const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// 必須envチェック（欠けてたらコンソールで即分かる）
const requiredKeys = [
"REACT_APP_FIREBASE_API_KEY",
"REACT_APP_FIREBASE_AUTH_DOMAIN",
"REACT_APP_FIREBASE_PROJECT_ID",
"REACT_APP_FIREBASE_STORAGE_BUCKET",
"REACT_APP_FIREBASE_MESSAGING_SENDER_ID",
"REACT_APP_FIREBASE_APP_ID",
];

const missing = requiredKeys.filter((k) => !process.env[k]);
if (missing.length) {
console.error("[firebase] Missing env vars:", missing);
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// iOS Safari対策：
// 1) localPersistence がダメなら session → memory にフォールバック
// 2) onAuthStateChanged を待つが、必ずタイムアウトで抜ける（無限ローディング防止）
export const authReady = (async () => {
// setPersistence が iOS/設定/ストレージ状態によって失敗することがある
try {
await setPersistence(auth, browserLocalPersistence);
// console.log("[firebase] persistence: local");
} catch (e1) {
console.warn("[firebase] local persistence failed:", e1);
try {
await setPersistence(auth, browserSessionPersistence);
// console.log("[firebase] persistence: session");
} catch (e2) {
console.warn("[firebase] session persistence failed:", e2);
await setPersistence(auth, inMemoryPersistence);
// console.log("[firebase] persistence: memory");
}
}

await new Promise((resolve) => {
let done = false;

const timer = setTimeout(() => {
if (done) return;
done = true;
try {
unsub && unsub();
} catch {}
console.warn("[firebase] authReady timeout -> continue");
resolve();
}, 4000); // 4秒で強制的に先へ（無限ローディング回避）

const unsub = onAuthStateChanged(
auth,
() => {
if (done) return;
done = true;
clearTimeout(timer);
try {
unsub();
} catch {}
resolve();
},
(err) => {
if (done) return;
done = true;
clearTimeout(timer);
try {
unsub();
} catch {}
console.warn("[firebase] onAuthStateChanged error:", err);
resolve();
}
);
});
})();