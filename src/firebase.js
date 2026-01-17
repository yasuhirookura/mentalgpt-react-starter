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
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// iOS Safari / PWA 対策：使える persistence を順に試す
async function setupPersistence() {
try {
await setPersistence(auth, indexedDBLocalPersistence);
console.log("[auth] persistence = indexedDB");
return "indexedDB";
} catch (e) {
console.warn("[auth] indexedDB failed", e);
}

try {
await setPersistence(auth, browserLocalPersistence);
console.log("[auth] persistence = localStorage");
return "localStorage";
} catch (e) {
console.warn("[auth] localStorage failed", e);
}

try {
await setPersistence(auth, browserSessionPersistence);
console.log("[auth] persistence = session");
return "session";
} catch (e) {
console.warn("[auth] session failed", e);
return "none";
}
}

// persistence 設定後、Auth状態が1回確定するのを待つ
export const authReady = (async () => {
await setupPersistence();
return await new Promise((resolve) => {
const unsub = onAuthStateChanged(auth, (user) => {
console.log("[authReady]", user ? user.uid : "no user");
unsub();
resolve(user || null);
});
});
})();