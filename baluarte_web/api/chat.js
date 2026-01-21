export default async function handler(req, res) {
  // 1. Manejo de CORS (Importante para que el frontend pueda hablar con el backend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // O pon tu dominio real en lugar de '*'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a preflight requests
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
      return res.status(500).json({ error: 'Falta la API Key en el servidor' });
    }

    // Construcción del payload
    const payload = {
      contents: [{ parts: [{ text: message }] }]
    };

    // Solo agregar instrucciones del sistema si existen
    if (system) {
      payload.systemInstruction = {
        parts: [{ text: system }]
      };
    }

    // CAMBIO IMPORTANTE: Usamos gemini-1.5-flash para asegurar estabilidad
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Error de Gemini:', data);
      return res.status(500).json({ error: data.error?.message || 'Error en Gemini API' });
    }

    return res.status(200).json({
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    });

  } catch (error) {
    console.error('Error del servidor:', error);
    return res.status(500).json({ error: error.message });
  }
}

