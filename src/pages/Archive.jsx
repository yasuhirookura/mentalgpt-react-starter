// src/pages/Archive.jsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";
import { auth, db } from "../firebase";

const PAGE_SIZE = 40;

export default function Archive() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u || null));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    resetAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const resetAndFetch = async () => {
    setItems([]);
    setCursor(null);
    setHasMore(true);
    setErr("");
    await fetchPage(true);
  };

  const fetchPage = async (isFirst = false) => {
    if (!user || (!isFirst && !hasMore)) return;
    setLoading(true);

    try {
      const col = collection(db, "conversations");

      const base = query(
        col,
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );

      const q = cursor ? query(base, startAfter(cursor)) : base;
      const snap = await getDocs(q);

      const docs = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          role: raw.role || "user",
          content: raw.content || "",
          dayKey: raw.dayKey || "",
          createdAt: raw.createdAt,
        };
      });

      setItems((prev) => [...prev, ...docs]);

      const last = snap.docs[snap.docs.length - 1] || null;
      setCursor(last);
      setHasMore(snap.size === PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setErr("履歴の取得に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <h1>アーカイブ</h1>
        <p>ログインが必要です。</p>
        <a className="btn" href="/login">ログインへ</a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 880 }}>
      <h1 style={{ marginBottom: 8 }}>アーカイブ</h1>

      {err && <div className="card error" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="stack" style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div key={it.id} className="card">
            <div style={{ fontSize: 12, color: "#667085" }}>
              {it.dayKey ? ${it.dayKey} /  : ""}
              {formatDateTime(it.createdAt)}
            </div>

            <div style={{ fontSize: 12, color: "#999", marginTop: 6 }}>
              {it.role === "ai" ? "MentalGPT" : "あなた"}
            </div>

            <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>
              {it.content || "(本文なし)"}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading && <p>読み込み中…</p>}
        {!loading && items.length === 0 && <p>項目はありません。</p>}
        {!loading && hasMore && (
          <button className="btn secondary" onClick={() => fetchPage(false)}>
            さらに読み込む
          </button>
        )}
      </div>
    </div>
  );
}

function formatDateTime(tsOrIso) {
  try {
    let d;
    if (tsOrIso?.toDate) d = tsOrIso.toDate();
    else if (typeof tsOrIso === "string") d = new Date(tsOrIso);
    else d = new Date(tsOrIso);
    return d.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}