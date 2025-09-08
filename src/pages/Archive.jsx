// src/pages/Archive.jsx
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, query, where, orderBy, limit, getDocs, startAfter,
  updateDoc, doc, serverTimestamp, Timestamp
} from "firebase/firestore";
import { auth, db } from "../firebase";

const PAGE_SIZE = 20;

export default function Archive() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("archived"); // "archived" | "trash"
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
    if (!user) { setLoading(false); return; }
    resetAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, tab]);

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
      // ★ 実データに合わせて conversations を参照
      const col = collection(db, "conversations");

      // status は存在しない既存レコードがあるので、クエリでは uid のみで絞り、
      // 取得後に JS 側で tab をフィルタする（既存は archived とみなす）
      const base = query(
        col,
        where("uid", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(PAGE_SIZE)
      );
      const q = cursor ? query(base, startAfter(cursor)) : base;
      const snap = await getDocs(q);

      // 既存スキーマに合わせて整形
      const docs = snap.docs.map((d) => {
        const raw = d.data();
        return {
          id: d.id,
          // 既存のフィールド名に合わせて本文を決める（なければ空文字）
          content: raw.content ?? raw.userMessage ?? "",
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt ?? raw.createdAt,
          status: raw.status ?? "archived",         // ← 無いものは archived とみなす
          graceUntil: raw.graceUntil ?? null,
        };
      })
      // JS 側でタブ（archived / trash）を反映
      .filter(it => it.status === tab);

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

  const actions = useMemo(() => ({
    async remove(id) {
      if (!user) return;
      const ref = doc(db, "conversations", id);
      const grace = Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      await updateDoc(ref, { status: "trash", graceUntil: grace, updatedAt: serverTimestamp() });
      setItems((prev) => prev.filter((x) => x.id !== id));
    },
    async restore(id) {
      if (!user) return;
      const ref = doc(db, "conversations", id);
      await updateDoc(ref, { status: "archived", graceUntil: null, updatedAt: serverTimestamp() });
      setItems((prev) => prev.filter((x) => x.id !== id));
    }
  }), [user]);

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
      <p className="note" style={{ marginBottom: 16 }}>
        {`保存期間は ${planText(uPlanFromLocal())}（+7日グレース）です。`}
      </p>

      {/* タブ */}
      <div className="tabs" style={{ marginBottom: 16 }}>
        <button className={`tab ${tab === "archived" ? "active" : ""}`} onClick={() => setTab("archived")}>
          アーカイブ
        </button>
        <button className={`tab ${tab === "trash" ? "active" : ""}`} onClick={() => setTab("trash")}>
          ゴミ箱（削除保留中）
        </button>
      </div>

      {err && <div className="card error" style={{ marginBottom: 12 }}>{err}</div>}

      {/* リスト */}
      <div className="stack" style={{ display: "grid", gap: 12 }}>
        {items.map((it) => (
          <ArchiveItem
            key={it.id}
            item={it}
            tab={tab}
            onRemove={() => actions.remove(it.id)}
            onRestore={() => actions.restore(it.id)}
          />
        ))}
      </div>

      {/* フッタ操作 */}
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

/* ---------- 子コンポーネント ---------- */
function ArchiveItem({ item, tab, onRemove, onRestore }) {
  const created = formatDateTime(item.createdAt);
  const grace = item.graceUntil ? formatDateTime(item.graceUntil) : null;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, color: "var(--muted, #667085)" }}>{created}</div>
          <div style={{ whiteSpace: "pre-wrap", marginTop: 6 }}>{item.content || "(本文なし)"}</div>
          {tab === "trash" && grace && (
            <div className="note" style={{ marginTop: 6 }}>
              完全削除予定：{grace}（自動処理）
            </div>
          )}
        </div>
        <div className="actions" style={{ display: "grid", gap: 8, alignContent: "start" }}>
          {tab === "archived" ? (
            <button className="btn secondary" onClick={onRemove} title="ゴミ箱へ移動">削除</button>
          ) : (
            <button className="btn" onClick={onRestore} title="アーカイブへ戻す">復元</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- ユーティリティ ---------- */
function formatDateTime(tsOrIso) {
  try {
    let d;
    if (tsOrIso?.toDate) d = tsOrIso.toDate();
    else if (typeof tsOrIso === "string") d = new Date(tsOrIso);
    else d = new Date(tsOrIso);
    return d.toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}
function uPlanFromLocal() {
  try {
    return localStorage.getItem("mgpt_user_plan") || "light";
  } catch { return "light"; }
}
function planText(code) { return code === "standard" ? "90日" : "30日"; }