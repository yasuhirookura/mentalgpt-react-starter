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

async function setupPersistence() {
// iOS Safari対策：IndexedDB → localStorage → session の順で確定
try {
await setPersistence(auth, indexedDBLocalPersistence);
console.log("[auth] persistence = indexedDB");
return;
} catch (e) {
console.warn("[auth] indexedDB persistence failed", e);
}

try {
await setPersistence(auth, browserLocalPersistence);
console.log("[auth] persistence = localStorage");
return;
} catch (e) {
console.warn("[auth] localStorage persistence failed", e);
}

try {
await setPersistence(auth, browserSessionPersistence);
console.warn("[auth] persistence = session (fallback)");
} catch (e) {
console.warn("[auth] session persistence failed", e);
}
}

/**
* persistence を確定させてから、Auth復元が「1回確定」するまで待つ
*/
export const authReady = (async () => {
await setupPersistence();

return new Promise((resolve) => {
const unsub = onAuthStateChanged(auth, (u) => {
console.log("[authReady]", u ? u.uid : "no user");
unsub();
resolve(u);
});
});
})();