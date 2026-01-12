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

  // ✅ サーバ（Firestore）由来の回数表示
  const [todayCount, setTodayCount] = useState(0);
  const [planLimit, setPlanLimit] = useState(10);
  const [usageDate, setUsageDate] = useState(""); // "YYYY-MM-DD" (JST)
  const [userEmail, setUserEmail] = useState("");
  const [userUid, setUserUid] = useState(""); // ← これを追加

  const endRef = useRef(null);

  function scrollToBottom(smooth = true) {
    const el = endRef.current;
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }

  async function getIdTokenOrNull() {
    try {
      await authReady; // 起動直後のズレ対策
      const u = auth.currentUser;
      if (!u) return null;
      setUserEmail(u.email || "");
      return await u.getIdToken();
    } catch {
      return null;
    }
  }

  // ✅ サーバ側の usage を取得して表示に反映
  async function refreshUsage() {
    const idToken = await getIdTokenOrNull();
    if (!idToken) return;

    const res = await fetch("/api/usage", {
      method: "GET",
      headers: { Authorization: Bearer ${idToken} },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.warn("[usage] failed", res.status, data);
      return;
    }

    const u = data?.usage;
    if (!u) return;

    setTodayCount(typeof u.usedToday === "number" ? u.usedToday : 0);
    setPlanLimit(typeof u.dailyLimit === "number" ? u.dailyLimit : 10);
    setUsageDate(u.date || "");
  }

  // 初回 & タブ復帰時に usage を更新（他ブラウザ/他タブとのズレも吸収）
  useEffect(() => {
    refreshUsage();

    const onFocus = () => refreshUsage();
    window.addEventListener("focus", onFocus);

    const onVis = () => {
      if (document.visibilityState === "visible") refreshUsage();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 下書き保存
  useEffect(() => {
    localStorage.setItem("draft", text);
  }, [text]);

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    if (body.length > MAX) return;
    if (isLoading) return;

    // 表示上の軽ガード（最終判定はサーバが行う）
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
      const idToken = await getIdTokenOrNull();

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
        // 429などもここで拾う
        const msg =
          data?.message ||
          (data?.error === "daily_limit"
            ? "本日の上限に達しました。明日またお待ちしています。"
            : "送信に失敗しました。もう一度お試しください。");
        throw new Error(msg);
      }

      const aiMsg = {
        id: `ai_${Date.now()}`,
        role: "ai",
        content: data.text ?? data.content ?? "(応答なし)",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setTimeout(() => scrollToBottom(), 0);

      // ✅ /api/chat が返してくれる usage を優先的に反映
      const u = data?.usage;
      if (u && typeof u.usedToday === "number") {
        setTodayCount(u.usedToday);
      } else {
        // 念のため再取得
        refreshUsage();
      }
    } catch (e) {
      console.error("[send] error", e);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "system",
          content: e?.message || "送信に失敗しました。もう一度お試しください。",
          createdAt: new Date().toISOString(),
        },
      ]);
      setTimeout(() => scrollToBottom(), 0);

      // 失敗時も、表示だけはサーバ基準に戻す
      refreshUsage();
    } finally {
      setIsLoading(false);
    }
  }

  const visibleMessages = messages; // 必要ならページング戻せます
  const over = text.length > MAX;
  const remain = Math.max(planLimit - todayCount, 0);

  return (
    <main className="container" style={{ maxWidth: 820, marginTop: 0, paddingTop: 0 }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, margin: "8px 0 4px" }}>
        <h1 style={{ margin: 0 }}>投稿</h1>

        <span style={{ fontSize: 13, color: "#666" }}>
          今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
          {usageDate ?  / ${usageDate} : ""}
        </span>

        <span style={{ marginLeft: "auto", fontSize: 13 }}>
          <Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
          {userEmail ? (
            <span style={{ marginLeft: 10, color: "#999" }}>({userEmail})</span>
          ) : null}
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
    return d.toLocaleString("ja-JP");
  } catch {
    return "";
  }
}