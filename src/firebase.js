// src/firebase.js
import { initializeApp } from "firebase/app";

import {
getAuth,
onAuthStateChanged,
setPersistence,
browserLocalPersistence,
} from "firebase/auth";

// （必要なら）Firestoreも使うので export します
import { getFirestore } from "firebase/firestore";

/**
* CRA(Create React App) は
* 環境変数が REACT_APP_ で始まる必要があります。
*/
const firebaseConfig = {
apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// もし env が未設定だと iPhone などで「読み込み中…」のままになりがちなので早期に分かるようにします
const missing = Object.entries(firebaseConfig)
.filter(([, v]) => !v)
.map(([k]) => k);

if (missing.length) {
// eslint-disable-next-line no-console
console.error("[firebase] Missing env vars:", missing.join(", "));
}

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
* ✅ ログイン保持（永続化）
* これが無いと iOS Safari で保持されなかったり、
* 状況によっては「読み込み中…」のままになりやすいです。
*
* ※ Promise ですが、アプリ全体を止めないため await はしません
*/
setPersistence(auth, browserLocalPersistence).catch((err) => {
// eslint-disable-next-line no-console
console.warn("[firebase] setPersistence failed:", err?.code, err?.message);
});

export const db = getFirestore(app);

/**
* authReady:
* - onAuthStateChanged が1回発火したタイミングで resolve
* - ルーティング側で「認証状態確定まで待つ」用途
*/
export const authReady = new Promise((resolve) => {
const unsubscribe = onAuthStateChanged(auth, () => {
unsubscribe();
resolve(true);
});
});