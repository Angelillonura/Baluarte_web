export default async function handler(req, res) {
  // Permitir solo el método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parsear el cuerpo de la solicitud
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, system } = body || {};

    // Validar que exista un mensaje
    if (!message) {
      return res.status(400).json({ error: 'Missing message' });
    }

    // Validar que exista la API Key
    if (!process.env.GEMINI_API_KEY) {
      console.error('Error: GEMINI_API_KEY no está configurada en las variables de entorno.');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Llamada a la API de Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: message }]
            }
          ],
          systemInstruction: {
            parts: [{ text: system || '' }]
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);
      return res.status(500).json({ error: 'Gemini API error' });
    }

    // Devolver la respuesta
    return res.status(200).json({
      text: data?.candidates?.[0]?.content?.parts?.[0]?.text || ''
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
}