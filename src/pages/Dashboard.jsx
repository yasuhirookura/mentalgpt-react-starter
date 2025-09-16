// api/chat.js
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'message is required' });
    }

    // 🔒 サーバ側でだけ読む
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing OPENAI_API_KEY' });

    // できるだけ安い/速いモデルを既定に
    const payload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'あなたは優しく簡潔に寄り添うメンタルサポーターです。専門的診断は行わず、安心と具体的な次の一歩を短めに提案してください。'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 350
    };

    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: Bearer ${apiKey}
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const err = await resp.text();
      return res.status(500).json({ error: 'OpenAI error', detail: err });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim() || '（応答を取得できませんでした）';
    return res.status(200).json({ text });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
}