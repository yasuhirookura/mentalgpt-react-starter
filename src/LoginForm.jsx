// 追加
import { useNavigate } from "react-router-dom";

export default function LoginForm() {
  const navigate = useNavigate();   // ← 追加

  // ...中略...

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    try {
      setLoading(true);

      if (mode === "signup") {
        // 既存のサインアップ処理…
        // サインアップ直後に遷移（メール未確認でもとりあえずマイページへ）
        navigate("/mypage");
      } else {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        console.log("[Login] success:", cred.user?.uid);
        // ★ ここが重要：ログイン成功時に遷移
        navigate("/mypage");  // 例）/dashboard でもOK
      }
    } catch (e) {
      console.error(e);
      setMsg(`${e.code ?? "error"}: ${e.message ?? e.toString()}`);
    } finally {
      setLoading(false);
    }
  };

  // Google ログインも同様に
  const handleGoogle = async () => {
    setMsg("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      console.log("[Login] Google success:", cred.user?.uid);
      navigate("/mypage");   // ← 追加
    } catch (e) {
      console.error(e);
      setMsg(`${e.code ?? "error"}: ${e.message ?? e.toString()}`);
    } finally {
      setLoading(false);
    }
  };
}