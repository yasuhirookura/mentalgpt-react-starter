// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Archive() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("archived"); // archived | trash
  const [items, setItems] = useState([]);
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
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      // 1) ルート: conversations（過去データがここにある想定）
      const convQ = query(
        collection(db, "conversations"),
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      // 2) サブ: users/{uid}/posts（新データがここにある想定）
      const postsQ = query(
        collection(db, "users", user.uid, "posts"),
        orderBy("createdAt", "desc")
      );

      const [convSnap, postsSnap] = await Promise.allSettled([
        getDocs(convQ),
        getDocs(postsQ),
      ]);

      const convItems =
        convSnap.status === "fulfilled"
          ? convSnap.value.docs.map((d) => normalizeDoc(d.id, d.data(), "conversations"))
          : [];

      const postItems =
        postsSnap.status === "fulfilled"
          ? postsSnap.value.docs.map((d) => normalizeDoc(d.id, d.data(), "users/{uid}/posts"))
          : [];

      // マージして createdAt でソート
      const merged = [...convItems, ...postItems]
        // status が無い古いデータは archived 扱い
        .map((x) => ({ ...x, status: x.status ?? "archived" }))
        .filter((x) => x.status === tab)
        .sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

      setItems(merged);

      // 参考：どっちから何件来たか（必要なら残してOK）
      console.log("[Archive] conv:", convItems.length, "posts:", postItems.length);
    } catch (e) {
      console.error(e);
      setErr("履歴の取得に失敗しました。");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const actions = useMemo(
    () => ({
      async moveToTrash(item) {
        if (!user) return;

        // どっちの保存先かで更新先を分ける
        const ref =
          item.source === "users/{uid}/posts"
            ? doc(db, "users", user.uid, "posts", item.id)
            : doc(db, "conversations", item.id);

        const grace = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));

        await updateDoc(ref, {
          status: "trash",
          graceUntil: grace,
          updatedAt: serverTimestamp(),
        });

        setItems((prev) => prev.filter((x) => x.id !== item.id));
      },
      async restore(item) {
        if (!user) return;

        const ref =
          item.source === "users/{uid}/posts"
            ? doc(db, "users", user.uid, "posts", item.id)
            : doc(db, "conversations", item.id);

        await updateDoc(ref, {
          status: "archived",
          graceUntil: null,
          updatedAt: serverTimestamp(),
        });

        setItems((prev) => prev.filter((x) => x.id !== item.id));
      },
    }),
    [user]
  );

  if (!user) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <h1>アーカイブ</h1>
        <p>ログインが必要です。</p>
        <a className="btn" href="/login">
          ログインへ
        </a>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 880 }}>
      <h1 style={{ marginBottom: 8 }}>アーカイブ</h1>

      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${tab === "archived" ? "active" : ""}`} onClick={() => setTab("archived")}>
          アーカイブ
        </button>
        <button className={`tab ${tab === "trash" ? "active" : ""}`} onClick={() => setTab("trash")}>
          ゴミ箱（削除保留中）
        </button>
      </div>

      {err && <div className="card error" style={{ marginBottom: 12 }}>{err}</div>}

      <div className="stack" style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <div key={`${it.source}:${it.id}`} className="card">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, color: "var(--muted, #667085)" }}>
                  {formatDateTime(it.createdAt)}
                  {"  "}
                  <span style={{ opacity: 0.6 }}>({it.source})</span>
                </div>
                <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{it.content || "(本文なし)"}</div>
                {tab === "trash" && it.graceUntil && (
                  <div className="note" style={{ marginTop: 6 }}>
                    完全削除予定：{formatDateTime(it.graceUntil)}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gap: 8, alignContent: "start" }}>
                {tab === "archived" ? (
                  <button className="btn secondary" onClick={() => actions.moveToTrash(it)}>削除</button>
                ) : (
                  <button className="btn" onClick={() => actions.restore(it)}>復元</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        {loading && <p>読み込み中…</p>}
        {!loading && items.length === 0 && <p>項目はありません。</p>}
      </div>
    </div>
  );
}

/* ---------- 正規化 ---------- */
function normalizeDoc(id, raw, source) {
  return {
    id,
    source,
    // 本文フィールド名の揺れを吸収
    content: raw.content ?? raw.userMessage ?? raw.text ?? "",
    createdAt: raw.createdAt ?? raw.created_at ?? raw.ts ?? null,
    status: raw.status ?? null,
    graceUntil: raw.graceUntil ?? null,
  };
}

/* ---------- 日付処理 ---------- */
function toMillis(tsOrIso) {
  try {
    if (!tsOrIso) return 0;
    if (tsOrIso?.toDate) return tsOrIso.toDate().getTime();
    if (typeof tsOrIso === "string") return new Date(tsOrIso).getTime() || 0;
    if (typeof tsOrIso === "number") return tsOrIso;
    return new Date(tsOrIso).getTime() || 0;
  } catch {
    return 0;
  }
}

function formatDateTime(tsOrIso) {
  const ms = toMillis(tsOrIso);
  if (!ms) return "—";
  return new Date(ms).toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}