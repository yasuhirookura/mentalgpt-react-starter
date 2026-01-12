// src/pages/Dashboard.jsx
import "../styles/Button.css";
import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import TextareaAutosize from "react-textarea-autosize";
import { auth, authReady } from "../firebase";

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
  const [usageDate, setUsageDate] = useState(""); // "YYYY-MM-DD"

  const endRef = useRef(null);
  const scrollWrapRef = useRef(null);

  // 起動時：Auth準備 → /api/usage でサーバーの回数を取得
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        await authReady;
        const u = auth.currentUser;
        if (!u) return;

        const idToken = await u.getIdToken();
        const res = await fetch("/api/usage", {
          method: "GET",
          headers: {
            ...(idToken ? { Authorization: Bearer ${idToken} } : {}),
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!mounted) return;

        if (res.ok && data?.usage) {
          setTodayCount(Number(data.usage.usedToday || 0));
          setPlanLimit(Number(data.usage.dailyLimit || 10));
          setUsageDate(String(data.usage.date || ""));
        }
      } catch (e) {
        // usage取得失敗は致命的ではないので黙ってOK（必要ならconsole出す）
        console.warn("[usage] fetch failed", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("draft", text);
  }, [text]);

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    if (body.length > MAX) return;
    if (isLoading) return;

    // ✅ 表示上のガード（最終判定はサーバーの 429）
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
      const idToken = u ? await u.getIdToken() : null;

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { Authorization: Bearer ${idToken} } : {}),
        },
        body: JSON.stringify({ message: body }),
      });

      const data = await res.json().catch(() => ({}));

      // 429 / 401 / 500 など
      if (!res.ok) {
        // 429（日次上限）はメッセージを分けて表示
        if (res.status === 429 && data?.error === "daily_limit") {
          setMessages((prev) => [
            ...prev,
            {
              id: `limit_${Date.now()}`,
              role: "system",
              content:
                data?.message ||
                "本日の上限に達しました。明日またお待ちしています。",
              createdAt: new Date().toISOString(),
            },
          ]);

          // 可能なら usage を反映
          if (data?.dailyLimit != null) setPlanLimit(Number(data.dailyLimit));
          if (data?.usedToday != null) setTodayCount(Number(data.usedToday));
          if (data?.date) setUsageDate(String(data.date));

          setTimeout(() => scrollToBottom(), 0);
          return;
        }

        throw new Error(data?.error || `POST /api/chat failed: ${res.status}`);
      }

      // ✅ 成功：サーバーの usage をそのまま採用（ブラウザ依存ゼロ）
      if (data?.usage) {
        setTodayCount(Number(data.usage.usedToday || 0));
        setPlanLimit(Number(data.usage.dailyLimit || 10));
        setUsageDate(String(data.usage.date || ""));
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

  function scrollToBottom(smooth = true) {
    const el = endRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  function onKeyDown(e) {
    // 必要なら Ctrl+Enter 送信などに
    // if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSend();
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
    const d = new Date(ts);
    return d.toLocaleString("ja-JP");
  } catch {
    return "";
  }
}