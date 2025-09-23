// api/chat.js
function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req, res) {
  cors(res);

  console.log("[api/chat] headers.origin:", req.headers.origin);
  console.log("[api/chat] body:", req.body);

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const { message, messages } = req.body || {};
    const userMessage =
      message ?? (Array.isArray(messages) ? messages[messages.length - 1]?.content : null);

    if (!userMessage || typeof userMessage !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "あなたは優しく簡潔に寄り添うメンタルサポーターです。…" },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
      max_tokens: 350,
    };

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.text();
      console.error("[api/chat] OpenAI error", resp.status, err);
      return res.status(500).json({ error: "OpenAI error", status: resp.status, detail: err });
    }

    const data = await resp.json();
    const text = data.choices?.[0]?.message?.content?.trim() || "（応答を取得できませんでした）";
    return res.status(200).json({ text });
  } catch (e) {
    console.error("[api/chat] server error", e);
    return res.status(500).json({ error: "server error" });
  }
}