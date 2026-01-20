export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, system } = req.body;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: {
            parts: [{ text: system }]
          }
        })
      }
    );

    const data = await response.json();

    res.status(200).json({
      text: data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    });

  } catch (err) {
    res.status(500).json({ error: 'Gemini error' });
  }
}
