export default async function handler(req, res) {
  // 1. Configuración de CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, system } = body || {};

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Falta GEMINI_API_KEY en Vercel' });
    }

    const MODEL_NAME = 'gemini-1.5-flash';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: message }] }]
    };

    if (system) {
      payload.systemInstruction = {
        parts: [{ text: system }]
      };
    }

    // 3. Llamada a Google
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Error detallado de Gemini:', JSON.stringify(data, null, 2));
      // Devolvemos el mensaje exacto de Google para que lo veas en consola si falla
      return res.status(500).json({ error: data.error?.message || 'Error en la API de Google' });
    }

    return res.status(200).json({
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    });

  } catch (error) {
    console.error('Error del servidor:', error);
    return res.status(500).json({ error: error.message });
  }
}
