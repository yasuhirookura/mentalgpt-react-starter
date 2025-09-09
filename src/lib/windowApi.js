// src/lib/windowApi.js
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, limit, getDocs, addDoc,
  serverTimestamp, Timestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

// サインイン完了まで待つユーティリティ
function waitForUser() {
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      u ? resolve(u) : reject(new Error("AUTH_REQUIRED"));
    });
  });
}

// 今日の0時
function startOfTodayTs() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return Timestamp.fromDate(d);
}

async function fetchRecentMessages({ limit: lim = 50 } = {}) {
  const user = await waitForUser();
  // アーカイブ（=通常の保存分）だけを新しい順で
  const q = query(
    collection(db, "users", user.uid, "posts"),
    where("status", "==", "archived"),
    orderBy("createdAt", "desc"),
    limit(lim)
  );
  const snap = await getDocs(q);
  // Archive のフィールドに合わせて Dashboard 用の形へ整形
  return snap.docs.map(d => {
    const x = d.data();
    return {
      id: d.id,
      role: x.role || "user",                 // role が無ければ user で表示
      content: x.content || "",
      createdAt: (x.createdAt?.toDate?.() || new Date()).toISOString(),
    };
  }).reverse(); // 画面は古い→新しいで並べたい場合は reverse
}

async function getTodayCount() {
  const user = await waitForUser();
  const q = query(
    collection(db, "users", user.uid, "posts"),
    where("status", "==", "archived"),
    where("createdAt", ">=", startOfTodayTs())
  );
  const snap = await getDocs(q);
  return snap.size;
}

async function getPlan() {
  // MVP：ローカル保存値を参照（なければ light）
  try { return localStorage.getItem("mgpt_user_plan") || "light"; }
  catch { return "light"; }
}

async function sendMessage(text) {
  const user = await waitForUser();

  // 1) ユーザー投稿を書き込み
  const userDoc = await addDoc(
    collection(db, "users", user.uid, "posts"),
    {
      role: "user",
      content: text,
      status: "archived",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  // 2) （MVP）AI返信はダミーで保存
  //    ※本番は /api/chat を呼んで内容を返す想定
  const aiDoc = await addDoc(
    collection(db, "users", user.uid, "posts"),
    {
      role: "ai",
      content: "お話しありがとうございます。続けて感じたことも自由に書いてみてくださいね。",
      status: "archived",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
  );

  // Dashboard.jsx が期待する返り値
  return {
    id: aiDoc.id,
    role: "ai",
    content: "お話しありがとうございます。続けて感じたことも自由に書いてみてくださいね。",
    createdAt: new Date().toISOString(),
  };
}

// グローバルへ公開（既にあれば上書きしない）
if (!window.api) {
  window.api = { fetchRecentMessages, getTodayCount, getPlan, sendMessage };
}