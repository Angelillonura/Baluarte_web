const RATE_LIMIT_MS = 2000;
let lastRequest = 0;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ⏱️ Rate limit básico
  const now = Date.now();
  if (now - lastRequest < RATE_LIMIT_MS) {
    return res.status(429).json({ error: 'Too many requests' });
  }
  lastRequest = now;

  const { message, system } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                { text: `${system}\n\nUser: ${message}` }
              ]
            }
          ]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', data);
      return res.status(500).json({ error: 'AI service error' });
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response from AI.';

    // 🔐 RESPUESTA SEGURA (solo texto)
    return res.status(200).json({
      text: String(text)
    });

  } catch (err) {
    console.error('Chat API error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
