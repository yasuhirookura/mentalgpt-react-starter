// src/MentalGPT.jsx
import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

import Heartbeat from "./components/Heartbeat"; // ← 既にあるハート
import "./components/Heartbeat.css";            // ← スタイル

function MentalGPT({ user }) {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState([]);
  const [thinking, setThinking] = useState(false); // ← 考え中フラグ

  // 直近10件の表示
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const q = query(
          collection(db, "conversations"),
          where("uid", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(10)
        );
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setHistory(rows);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [user]);

  // 送信
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    try {
      setThinking(true); // ← ハート始動

      // 自前バックエンド（/api/chat）へ
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim() }),
      });

      if (!res.ok) {
        // API側が { error: "..."} を返す想定
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "API error");
      }

      const { text } = await res.json();
      const aiMessage =
        text ||
        "MentalGPT：受け止めました。気持ちを言葉にするだけでも前進です。一緒に整えていきましょう。";

      setResponse(aiMessage);

      await addDoc(collection(db, "conversations"), {
        uid: user.uid,
        userMessage: input.trim(),
        gptResponse: aiMessage,
        createdAt: serverTimestamp(),
      });

      setInput("");
      // 先頭に追加して画面反映
      setHistory((prev) => [
        {
          id: crypto.randomUUID(),
          uid: user.uid,
          userMessage: input.trim(),
          gptResponse: aiMessage,
          createdAt: { seconds: Date.now() / 1000 },
        },
        ...prev,
      ]);
    } catch (e) {
      console.error(e);
      alert("エラーが発生しました。少し時間をおいてお試しください。");
    } finally {
      setThinking(false); // ← ハート停止
    }
  };

  return (
    <div>
      <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
        MentalGPT
        {/* 考え中だけ鼓動。止まって見える＝AIの発言側の目印 */}
        <Heartbeat size={40} running={thinking} />
      </h1>

      <form onSubmit={handleSubmit} style={{ marginBottom: 16 }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="今日の気持ちを入力してください…（400文字まで）"
          rows={5}
          style={{ width: "100%", boxSizing: "border-box" }}
          maxLength={400}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
          <button type="submit">送信</button>
          <span style={{ color: "#666", fontSize: 12 }}>
            残り {400 - input.length} 文字
          </span>
        </div>
      </form>

      {response && (
        <div
          style={{
            background: "#eef5ff",
            padding: 12,
            borderRadius: 8,
            marginBottom: 24,
          }}
          aria-live="polite"
        >
          {response}
        </div>
      )}

      <h3>これまでのやりとり（直近10件）</h3>
      {history.length === 0 && <div>まだ保存されたやりとりはありません。</div>}

      <div style={{ display: "grid", gap: 12 }}>
        {history.map((item) => (
          <div key={item.id} style={{ border: "1px solid #eee", borderRadius: 8, padding: 12 }}>
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>あなた：</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{item.userMessage}</div>
            <div style={{ height: 8 }} />
            <div style={{ fontWeight: "bold", marginBottom: 6 }}>MentalGPT：</div>
            <div style={{ whiteSpace: "pre-wrap" }}>{item.gptResponse}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MentalGPT; // ← ここが超重要（named exportにしない）