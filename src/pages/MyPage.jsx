// src/pages/MyPage.jsx
import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function MyPage() {
  const [user, setUser] = useState(null);
  const [uDoc, setUDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // 解約用（今回の追加分）
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelMsg, setCancelMsg] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setLoading(true);
      setErr("");
      if (!u) {
        setUser(null);
        setUDoc(null);
        setLoading(false);
        return;
      }
      setUser(u);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        setUDoc(snap.exists() ? snap.data() : {});
      } catch (e) {
        console.error(e);
        setErr("ユーザー情報の取得に失敗しました。時間をおいて再度お試しください。");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // 🔴 解約リクエストを Firestore に立てるだけのやつ
  const handleCancelSubscription = async () => {
    if (!user?.uid) {
      setCancelMsg("ユーザー情報が取得できませんでした。ログインし直してお試しください。");
      return;
    }
    setCancelLoading(true);
    setCancelMsg("");
    try {
      const ref = doc(db, "users", user.uid);
      await setDoc(
        ref,
        {
          cancelRequested: true,
          cancelRequestedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setCancelMsg("解約リクエストを受け付けました。運営側で処理します。");
    } catch (e) {
      console.error(e);
      setCancelMsg("解約リクエストの登録に失敗しました。時間をおいてもう一度お試しください。");
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <p>読み込み中…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container" style={{ padding: "48px 16px" }}>
        <h1>マイページ</h1>
        <p>ログインが必要です。</p>
        <a className="btn" href="/login">
          ログインへ
        </a>
      </div>
    );
  }

  // 表示整形
  const email = user.email ?? "(メール未設定)";
  const emailVerified = !!user.emailVerified;
  const joinedAt = uDoc?.joinedAt ? formatDate(uDoc.joinedAt) : "（表示準備中）";
  const supportId = uDoc?.supportDisplayId ?? "（準備中）";

  const plan = uDoc?.plan ?? "free"; // "trial" | "light" | "standard" | "free"
  const planLabel = toPlanLabel(plan);
  const postsLimit =
    uDoc?.dailyLimit ?? (plan === "standard" ? 30 : plan === "light" ? 10 : 10);
  const usedToday = uDoc?.usedToday ?? 0;
  const remainToday = Math.max(postsLimit - usedToday, 0);

  const canExportCsv = plan === "standard"; // MVP：スタンダードで解放

  const handleExportCsv = async () => {
    alert("CSV出力は準備中です（スタンダード向け）。リリース後、/api/export からダウンロードできるようにします。");
  };

  const handleManagePlan = () => {
    window.location.href = "/pricing";
  };

  return (
    <div className="container" style={{ padding: "32px 16px", maxWidth: 880 }}>
      <h1 style={{ marginBottom: 8 }}>マイページ</h1>
      <p style={{ color: "var(--muted, #667085)" }}>
        アカウント情報とご契約プランの確認ができます。
      </p>

      {err && (
        <div className="card error" role="alert" style={{ marginBottom: 16 }}>
          {err}
        </div>
      )}

      {/* アカウント */}
      <section className="card" style={{ marginBottom: 16 }}>
        <h2>アカウント</h2>
        <Row label="メールアドレス">
          <>
            {email}{" "}
            {emailVerified ? (
              <span className="badge ok">確認済み</span>
            ) : (
              <span className="badge warn">未確認</span>
            )}
          </>
        </Row>
        <Row label="サポートID">
          <span className="mono">{supportId}</span>
        </Row>
        <Row label="入会日">{joinedAt}</Row>
      </section>

      {/* プラン */}
      <section className="card" style={{ marginBottom: 16 }}>
        <h2>ご契約プラン</h2>
        <Row label="現在のプラン">
          <>
            {planLabel}
            {plan === "trial" && <span className="badge">無料体験中</span>}
          </>
        </Row>
        <Row label="本日の残り相談回数">
          <>
            <strong>{remainToday}</strong> 回（上限 {postsLimit} 回/日）
          </>
        </Row>
        <Row label="保存期間">
          {plan === "standard" ? "90日（+7日グレース）" : "30日（+7日グレース）"}
        </Row>
        <Row label="次回請求日">（自動表示に対応予定）</Row>

        <div
          className="actions"
          style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}
        >
          <button className="btn" onClick={handleManagePlan}>
            プランを確認・変更する
          </button>

          {/* 🔴 解約ボタン */}
          <button
            onClick={handleCancelSubscription}
            disabled={cancelLoading}
            style={{
              background: "#fff",
              border: "1px solid #d00",
              color: "#d00",
              padding: "0.45rem 0.8rem",
              borderRadius: 6,
              cursor: cancelLoading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {cancelLoading ? "解約リクエスト中…" : "解約する"}
          </button>
        </div>
        {cancelMsg && (
          <p style={{ marginTop: 8, color: "#444" }}>{cancelMsg}</p>
        )}

        <p className="note" style={{ marginTop: 8 }}>
          ※ デビットカードをご利用の方は、更新日前後の残高にご注意ください。
        </p>
      </section>

      {/* データ */}
      <section className="card">
        <h2>データ</h2>
        <Row label="保存履歴">
          <>
            直近の履歴は <a href="/dashboard">投稿画面</a> 下部に表示されます。<br />
            過去の履歴は <a href="/archive">アーカイブ</a> で閲覧・復元できます。
          </>
        </Row>
        <Row label="CSV出力">
          <>
            <button
              className="btn secondary"
              onClick={handleExportCsv}
              disabled={!canExportCsv}
              title={canExportCsv ? "" : "スタンダードプランでご利用いただけます"}
            >
              CSVをダウンロード
            </button>
            {!canExportCsv && (
              <span className="note" style={{ marginLeft: 12 }}>
                CSVをダウンロード（近日公開予定）
              </span>
            )}
          </>
        </Row>
      </section>
    </div>
  );
}

/* ---------- 小物 ---------- */
function Row({ label, children }) {
  return (
    <div className="row">
      <div className="label">{label}</div>
      <div className="value">{children}</div>
    </div>
  );
}

function formatDate(tsOrIso) {
  try {
    let d;
    if (tsOrIso?.toDate) d = tsOrIso.toDate(); // Firestore Timestamp
    else if (typeof tsOrIso === "string") d = new Date(tsOrIso);
    else if (tsOrIso) d = new Date(tsOrIso);
    else return "—";
    return d.toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function toPlanLabel(code) {
  switch (code) {
    case "light":
      return "ライト（¥500/月）";
    case "standard":
      return "スタンダード（¥980/月）";
    case "trial":
      return "トライアル（1週間無料）";
    case "free":
      return "無料";
    default:
      return "未設定";
  }
}