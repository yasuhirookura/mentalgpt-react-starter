// src/pages/Dashboard.jsx
import "../styles/Button.css";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { auth, db } from "../firebase";

// Firestore
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";

const MAX = 400;
const HINTS = [
  "良い回答を考え中です…",
  "言葉を大切に選んでいます…",
  "あなたの気持ちに寄り添っています…",
  "少しだけお待ちください…",
];

export default function Dashboard() {
  const [text, setText] = useState(localStorage.getItem("draft") || "");
  const [isLoading, setIsLoading] = useState(false);
  const hint = useMemo(() => HINTS[Math.floor(Math.random() * HINTS.length)], []);
  const [messages, setMessages] = useState([]);

  // ✅ サーバー（Firestore）基準の回数
  const [todayCount, setTodayCount] = useState(0);
  const [planLimit, setPlanLimit] = useState(10);

  const endRef = useRef(null);
  const scrollWrapRef = useRef(null);

  const over = text.length > MAX;
  const remain = Math.max(planLimit - todayCount, 0);

  function scrollToBottom(smooth = true) {
    const el = endRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  // 下書き保存
  useEffect(() => {
    localStorage.setItem("draft", text);
  }, [text]);

  // ✅ サーバー側 usage を取得（ブラウザを変えても同じ値になる）
  async function fetchUsage() {
    const u = auth.currentUser;
    const idToken = u ? await u.getIdToken() : null;
    if (!idToken) return;

    const res = await fetch("/api/usage", {
      method: "GET",
      headers: { Authorization: Bearer ${idToken} },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;

    const usedToday = data?.usage?.usedToday ?? 0;
    const dailyLimit = data?.usage?.dailyLimit ?? 10;
    setTodayCount(usedToday);
    setPlanLimit(dailyLimit);
  }

  // ✅ 履歴：Firestoreから購読（ブラウザを変えても同じ会話が出る）
  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    // まず usage 取得
    fetchUsage();

    // messages 購読
    const ref = collection(db, "users", u.uid, "messages");
    const q = query(ref, orderBy("createdAt", "asc"), limit(300));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const v = d.data();
          return {
            id: d.id,
            role: v.role || "system",
            content: v.content || "",
            createdAt: v.createdAt?.toDate?.()?.toISOString?.() || "",
          };
        });
        setMessages(rows);
        setTimeout(() => scrollToBottom(false), 0);
      },
      (err) => {
        console.error("[firestore] onSnapshot error", err);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Firestoreに1件保存
  async function saveMessageToFirestore(role, content) {
    const u = auth.currentUser;
    if (!u) return;

    const ref = collection(db, "users", u.uid, "messages");
    await addDoc(ref, {
      role,
      content,
      createdAt: serverTimestamp(),
    });
  }

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    if (body.length > MAX) return;
    if (isLoading) return;

    // ✅ サーバー基準で上限チェック（表示もサーバー基準）
    if (todayCount >= planLimit) {
      alert("本日の上限に達しました。明日またご利用ください。");
      return;
    }

    setIsLoading(true);
    setText("");
    localStorage.setItem("draft", "");

    try {
      const u = auth.currentUser;
      const idToken = u ? await u.getIdToken() : null;
      if (!idToken) {
        await saveMessageToFirestore("system", "ログイン情報を確認できませんでした。再ログインしてください。");
        return;
      }

      // 先にユーザー発言をFirestoreへ（＝履歴が残る）
      await saveMessageToFirestore("user", body);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ message: body }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // 429（上限）など
        if (res.status === 429) {
          const msg =
            data?.message ||
            "本日の上限に達しました。明日またお待ちしています。";
          await saveMessageToFirestore("system", msg);
          // usageを取り直して表示を揃える
          await fetchUsage();
          return;
        }

        throw new Error(data?.error || `POST /api/chat failed: ${res.status}`);
      }

      const aiText = data?.text ?? data?.content ?? "（応答なし）";
      await saveMessageToFirestore("ai", aiText);

      // ✅ /api/chat が返す usage で、表示の回数を即一致させる
      const usedToday = data?.usage?.usedToday;
      const dailyLimit = data?.usage?.dailyLimit;
      if (typeof usedToday === "number") setTodayCount(usedToday);
      if (typeof dailyLimit === "number") setPlanLimit(dailyLimit);

      setTimeout(() => scrollToBottom(), 0);
    } catch (e) {
      console.error("[send] error", e);
      await saveMessageToFirestore("system", "送信に失敗しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  }

  function onKeyDown(e) {
    // Enter送信を有効にしたい場合はここで制御（今は無効のまま）
  }

  return (
    <main className="container" style={{ maxWidth: 820, marginTop: 0, paddingTop: 0 }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "8px 0 4px" }}>
        <h1 style={{ margin: 0 }}>投稿</h1>
        <span style={{ fontSize: 13, color: "#666" }}>
          今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
        </span>
        <span style={{ marginLeft: "auto", fontSize: 13 }}>
          <Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
        </span>
      </header>

      <div
        ref={scrollWrapRef}
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: "12px",
          minHeight: "52vh",
          maxHeight: "72vh",
          overflowY: "auto",
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ flexGrow: 1 }} />

        {messages.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", margin: "12px 0" }}>
            ここに会話が表示されます。下の入力欄から気持ちを書いてみてください。
          </p>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
        ))}

        <div ref={endRef} />
      </div>

      {/* 入力エリア */}
      <div style={{ position: "sticky", bottom: 8, marginTop: 8, paddingTop: 0 }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-end",
            background: "#f9fafb",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 10,
          }}
        >
          <TextareaAutosize
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="今の気分や、頭に浮かんだことを、自由にどうぞ（400文字まで）"
            minRows={2}
            maxRows={10}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              resize: "none",
              background: "transparent",
              lineHeight: 1.8,
              fontSize: 16,
            }}
          />

          <button
            type="button"
            aria-label="送信"
            onClick={handleSend}
            disabled={isLoading || !text.trim() || over || todayCount >= planLimit}
            title={over ? "文字数が多すぎます" : "送信"}
            className="sendButton"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="23" />
              <polygon points="18,12 36,24 18,36" fill="white" />
            </svg>
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 6 }}>
          <span style={{ fontSize: 12, color: over ? "#c00" : "#666" }}>
            {Math.min(text.length, MAX)} / {MAX}
          </span>
          {isLoading && <span style={{ fontSize: 12, color: "#0a6cff", marginLeft: 8 }}>{hint}</span>}
        </div>
      </div>
    </main>
  );
}

/* ------ バブル ------ */
function MessageBubble({ role, content, createdAt }) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        margin: "8px 0",
      }}
    >
      <div
        style={{
          background: role === "ai" ? "#f6f6f6" : isUser ? "#e7f1ff" : "#fff6e6",
          border: "1px solid #e5e7eb",
          padding: "10px 12px",
          borderRadius: 12,
          maxWidth: "85%",
          lineHeight: 1.8,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
          {isUser ? "あなた" : role === "ai" ? "MentalGPT" : "システム"} ・ {formatTime(createdAt)}
        </div>
        <div>{content}</div>
      </div>
    </div>
  );
}

/* ------ util ------ */
function formatTime(ts) {
  try {
    if (!ts) return "";
    const d = new Date(ts);
    return d.toLocaleString("ja-JP");
  } catch {
    return "";
  }
}