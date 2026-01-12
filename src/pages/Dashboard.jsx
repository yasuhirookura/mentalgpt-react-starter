// src/pages/Dashboard.jsx
import "../styles/Button.css";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { auth, authReady } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

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
  const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
  const [messages, setMessages] = useState([]);
  const [pageCount, setPageCount] = useState(30);

  // ✅ サーバー由来の利用状況
  const [todayCount, setTodayCount] = useState(0);
  const [planLimit, setPlanLimit] = useState(10);
  const [usageDate, setUsageDate] = useState("");
  const [email, setEmail] = useState("");

  const endRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("draft", text);
  }, [text]);

  const scrollToBottom = (smooth = true) => {
    const el = endRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  };

  // ✅ usage取得（いつでも呼べる）
  const refreshUsage = useCallback(async () => {
    await authReady;
    const u = auth.currentUser;
    if (!u) return;

    setEmail(u.email || "");

    const idToken = await u.getIdToken(true); // ←強制リフレッシュ（保険）
    const res = await fetch("/api/usage", {
      method: "GET",
      headers: { ...(idToken ? { Authorization: Bearer ${idToken} } : {}) },
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.usage) {
      setTodayCount(Number(data.usage.usedToday || 0));
      setPlanLimit(Number(data.usage.dailyLimit || 10));
      setUsageDate(String(data.usage.date || ""));
    }
  }, []);

  // ✅ Auth状態が変わるたびに usageを取り直す
  useEffect(() => {
    let unsub = () => {};
    (async () => {
      await authReady;
      unsub = onAuthStateChanged(auth, (u) => {
        setEmail(u?.email || "");
        if (u) refreshUsage();
      });

      // 起動直後にも一応
      if (auth.currentUser) refreshUsage();
    })();

    return () => unsub();
  }, [refreshUsage]);

  // ✅ 別タブ/別ブラウザで進んだ回数も、戻ってきたら反映
  useEffect(() => {
    const onFocus = () => {
      if (auth.currentUser) refreshUsage();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refreshUsage]);

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    if (body.length > MAX) return;
    if (isLoading) return;

    // 表示上のガード（最終判定はサーバー429）
    if (todayCount >= planLimit) {
      alert("本日の上限に達しました。明日またご利用ください。");
      return;
    }

    setIsLoading(true);
    setText("");
    localStorage.setItem("draft", "");

    const userMsg = {
      id: `user_${Date.now()}`,
      role: "user",
      content: body,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setTimeout(() => scrollToBottom(false), 0);

    try {
      await authReady;
      const u = auth.currentUser;
      const idToken = u ? await u.getIdToken(true) : null;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: Bearer ${idToken} } : {}),
        },
        body: JSON.stringify({ message: body }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 && data?.error === "daily_limit") {
          setMessages((prev) => [
            ...prev,
            {
              id: `limit_${Date.now()}`,
              role: "system",
              content: data?.message || "本日の上限に達しました。明日またお待ちしています。",
              createdAt: new Date().toISOString(),
            },
          ]);

          // 返ってきた値があれば反映
          if (data?.dailyLimit != null) setPlanLimit(Number(data.dailyLimit));
          if (data?.usedToday != null) setTodayCount(Number(data.usedToday));
          if (data?.date) setUsageDate(String(data.date));

          setTimeout(() => scrollToBottom(), 0);
          return;
        }
        throw new Error(data?.error || `POST /api/chat failed: ${res.status}`);
      }

      // ✅ 成功：サーバーの usage を採用
      if (data?.usage) {
        setTodayCount(Number(data.usage.usedToday || 0));
        setPlanLimit(Number(data.usage.dailyLimit || 10));
        setUsageDate(String(data.usage.date || ""));
      } else {
        // 保険：usageが無かったら取り直す
        refreshUsage();
      }

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: "ai",
        content: data.text ?? data.content ?? "(応答なし)",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => scrollToBottom(), 0);
    } catch (e) {
      console.error("[send] error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "system",
          content: "送信に失敗しました。もう一度お試しください。",
          createdAt: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollToBottom(), 0);
    } finally {
      setIsLoading(false);
    }
  }

  const visibleMessages = messages.slice(-pageCount);
  const over = text.length > MAX;
  const remain = Math.max(planLimit - todayCount, 0);

  return (
    <main className="container" style={{ maxWidth: 820, marginTop: 0, paddingTop: 0 }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "8px 0 4px" }}>
        <h1 style={{ margin: 0 }}>投稿</h1>

        <span style={{ fontSize: 13, color: "#666" }}>
          今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
          {usageDate ? <span style={{ marginLeft: 8 }}>[{usageDate}]</span> : null}
        </span>

        <span style={{ marginLeft: "auto", fontSize: 13, display: "flex", gap: 10, alignItems: "center" }}>
          {/* デバッグ用：同一アカウントか確認 */}
          <span style={{ color: "#999", fontSize: 12 }}>{email ? (${email}) : ""}</span>

          <Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
        </span>
      </header>

      <div
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

        {visibleMessages.length === 0 && (
          <p style={{ color: "#888", textAlign: "center", margin: "12px 0" }}>
            ここに会話が表示されます。下の入力欄から気持ちを書いてみてください。
          </p>
        )}

        {visibleMessages.map((m) => (
          <MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
        ))}

        {messages.length > pageCount && (
          <div style={{ textAlign: "center", margin: "12px 0 8px" }}>
            <button className="btn btn-outline" onClick={() => setPageCount((c) => c + 20)}>
              もっと見る
            </button>
          </div>
        )}

        <div ref={endRef} />
      </div>

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

function MessageBubble({ role, content, createdAt }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start", margin: "8px 0" }}>
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

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleSt