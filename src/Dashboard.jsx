// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
// Firestore 読み書きは既存の util/ hooks に合わせて差し替えてください
// 例：getTodayCount(uid), incrementCount(uid), fetchRecentMessages(uid), sendMessage(text)

const MAX = 400;
const HINTS = [
  "良い回答を考え中です…",
  "言葉を大切に選んでいます…",
  "あなたの気持ちに寄り添っています…",
  "少しだけお待ちください…"
];

export default function Dashboard() {
  const nav = useNavigate();
  const [text, setText] = useState(localStorage.getItem("draft") || "");
  const [isLoading, setIsLoading] = useState(false);
  const [hint] = useState(() => HINTS[Math.floor(Math.random() * HINTS.length)]);
  const [messages, setMessages] = useState([]);      // { id, role: "user"|"ai", content, createdAt }[]
  const [pageCount, setPageCount] = useState(10);    // 初回10件
  const [todayCount, setTodayCount] = useState(0);   // UI表示用（MVP）
  const [planLimit, setPlanLimit] = useState(10);    // "trial/ライト=10、スタンダード=30" とりあえず10で
  const endRef = useRef(null);

  // ▼ ここはあなたの実装に合わせて置き換え
  async function fetchInitial() {
    // 直近のメッセージ（配列を新しい順 or 古い順、どちらでもOK）
    const items = await window.api.fetchRecentMessages({ limit: 50 }); // 例
    setMessages(items || []);
    const count = await window.api.getTodayCount(); // 例：users/{uid}/usage/{YYYY-MM-DD}.count
    setTodayCount(count || 0);
    const plan = await window.api.getPlan(); // "light" | "standard" | "trial"
    setPlanLimit(plan === "standard" ? 30 : 10);
  }

  async function handleSend() {
    const body = text.trim();
    if (!body) return;
    if (body.length > MAX) return;
    if (isLoading) return;
    // フロント側軽ガード（サーバーenforceは後日）
    if (todayCount >= planLimit) {
      alert("本日の上限に達しました。明日またご利用ください。");
      return;
    }

    setIsLoading(true);
    try {
      setText("");
      localStorage.setItem("draft", "");
      // 送信直後にユーザー投稿を先行表示（楽観的UI）
      const tempId = `temp_${Date.now()}`;
      const userMsg = { id: tempId, role: "user", content: body, createdAt: new Date().toISOString() };
      setMessages(prev => [...prev, userMsg]);
      setTodayCount(c => c + 1);


      // サーバーへ送信（OpenAI呼び出し＋保存）
     const isLocal = location.hostname === "localhost" || location.hostname === "127.0.0.1";
     const API_BASE = isLocal ? "https://<あなたの本番ドメイン>" : "";

     const res = await fetch(`${API_BASE}/api/chat`, {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({ text: body }),});
     if (!res.ok) {
     const t = await res.text().catch(() => "");
     throw new Error(`POST /api/chat failed: ${res.status} ${t}`);
}
     const data = await res.json();
     const aiMsg = {
     id: `ai_${Date.now()}`,
     role: "ai",
     content: data.content ?? "(応答なし)",
     createdAt: new Date().toISOString(),
};

     setMessages(prev => [...prev.filter(m => m.id !== tempId), userMsg, aiMsg]);
      /*
      // サーバーへ送信（OpenAI呼び出し＋保存）
      const aiMsg = await window.api.sendMessage(body); // { id, role:"ai", content, createdAt }
      setMessages(prev => [...prev.filter(m => m.id !== tempId), userMsg, aiMsg]);
      */

      // スクロール追従
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
    } catch (e) {
      // 失敗時は回数を戻す & 失敗メッセージ
      setTodayCount(c => Math.max(0, c - 1));
      setMessages(prev => [...prev, { id: `err_${Date.now()}`, role: "system", content: "送信に失敗しました。もう一度お試しください。", createdAt: new Date().toISOString() }]);
    } finally {
      setIsLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  useEffect(() => { fetchInitial(); }, []);
  useEffect(() => { localStorage.setItem("draft", text); }, [text]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const visibleMessages = messages.slice(-pageCount);
  const over = text.length > MAX;
  const remain = Math.max(planLimit - todayCount, 0);

  return (
    <main className="container" style={{ maxWidth: 680 }}>
      <header style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
        <h1 style={{ margin: 0 }}>投稿</h1>
        <span style={{ fontSize: 13, color: "#666" }}>
          今日の利用回数：{todayCount} / {planLimit}（残り {remain}）
        </span>
        <span style={{ marginLeft: "auto", fontSize: 13 }}>
          <Link to="/mypage">マイページ</Link> / <Link to="/pricing">Pricing</Link>
        </span>
      </header>

      {/* 入力 */}
      <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: 12, marginBottom: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="いまの気持ちを自由に書いてください（400文字まで）"
          rows={4}
          style={{ width: "100%", border: "none", outline: "none", resize: "vertical", lineHeight: 1.8, fontSize: 16 }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 13, color: over ? "#c00" : "#666" }}>
            {Math.min(text.length, MAX)} / {MAX}
          </span>
          <div style={{ marginLeft: "auto" }}>
            <button
              onClick={handleSend}
              disabled={isLoading || !text.trim() || over || todayCount >= planLimit}
              className="btn btn-primary"
            >
              {isLoading ? "考え中…" : "送信"}
            </button>
          </div>
        </div>
        {isLoading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, color: "#3b6" }}>
            <span style={{
              width: 10, height: 10, borderRadius: "50%",
              background: "#39f", animation: "pulse 1.2s ease-in-out infinite"
            }} />
            <span style={{ fontSize: 13 }}>{hint}</span>
          </div>
        )}
      </div>

      {/* 履歴 */}
      <section>
        {visibleMessages.map(m => (
          <MessageBubble key={m.id} role={m.role} content={m.content} createdAt={m.createdAt} />
        ))}

        {/* もっと見る or アーカイブ */}
        {messages.length > pageCount ? (
          <div style={{ textAlign: "center", margin: "12px 0 24px" }}>
            <button className="btn btn-outline" onClick={() => setPageCount(c => c + 10)}>もっと見る</button>
            <span style={{ margin: "0 8px", color: "#999" }}> / </span>
            <Link to="/archive">アーカイブ</Link>
          </div>
        ) : (
          <div style={{ textAlign: "center", margin: "12px 0 24px" }}>
            <Link to="/archive">アーカイブへ</Link>
          </div>
        )}

        <div ref={endRef} />
      </section>

      {/* ちょいCSS（site.css に追加） */}
      {/* 
      @keyframes pulse { 0%{transform:scale(1);opacity:.8} 50%{transform:scale(1.25);opacity:1} 100%{transform:scale(1);opacity:.8} }
      .btn{cursor:pointer}
      .btn[disabled]{opacity:.6; cursor:not-allowed}
      */}
    </main>
  );
}

// 表示用の簡易バブル
function MessageBubble({ role, content, createdAt }) {
  const isUser = role === "user";
  return (
    <div style={{
      display: "flex",
      justifyContent: isUser ? "flex-end" : "flex-start",
      marginBottom: 8
    }}>
      <div style={{
        background: isUser ? "#e7f1ff" : "#f6f6f6",
        border: "1px solid #ddd",
        padding: "10px 12px",
        borderRadius: 12,
        maxWidth: "85%",
        lineHeight: 1.8,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 4 }}>
          {isUser ? "あなた" : "MentalGPT"} ・ {formatTime(createdAt)}
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