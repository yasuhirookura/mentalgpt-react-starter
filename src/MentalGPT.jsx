// 送信
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!input.trim()) return;

  try {
    // ← ハートの「考え中」開始（もし state があればセット）
    // setThinking(true) みたいなやつ。無ければスルーでOK。

    // 自前バックエンドを叩く
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input.trim() })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'API error');
    }

    const { text } = await res.json();
    const aiMessage =
      text ||
      'MentalGPT：受け止めました。気持ちを言葉にするだけでも前進です。一緒に整えていきましょう。';

    setResponse(aiMessage);

    await addDoc(collection(db, 'conversations'), {
      uid: user.uid,
      userMessage: input.trim(),
      gptResponse: aiMessage,
      createdAt: serverTimestamp()
    });

    setInput('');
    setHistory((prev) => [
      {
        id: crypto.randomUUID(),
        uid: user.uid,
        userMessage: input.trim(),
        gptResponse: aiMessage,
        createdAt: { seconds: Date.now() / 1000 }
      },
      ...prev
    ]);
  } catch (e) {
    console.error(e);
    alert('エラーが発生しました。少し時間をおいてお試しください。');
  } finally {
    // ← 考え中終了
    // setThinking(false)
  }
};