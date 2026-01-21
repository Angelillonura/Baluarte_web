// Nombre del archivo: api/chat.js

export default async function handler(req, res) {
  // 1. Configuración de CORS (Para permitir que tu web hable con el servidor)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Responder a la petición de "pre-vuelo" del navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo aceptamos POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    // 2. Verificación de Seguridad: ¿Existe la API Key?
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('ERROR CRÍTICO: No se encontró GEMINI_API_KEY en las variables de entorno de Vercel.');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor. Por favor avisa al administrador.' 
      });
    }

    // 3. Preparar los datos
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, system } = body || {};

    if (!message) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    // 4. Llamada a Google Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          systemInstruction: system ? { parts: [{ text: system }] } : undefined
        })
      }
    );

    const data = await response.json();

    // Si Google devuelve error, lo mostramos
    if (!response.ok) {
      console.error('Error de Google API:', JSON.stringify(data, null, 2));
      return res.status(500).json({ 
        error: data.error?.message || 'Error al conectar con la IA.' 
      });
    }

    // Respuesta exitosa
    const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return res.status(200).json({ text: botReply });

  } catch (error) {
    console.error('Error interno del servidor:', error);
    return res.status(500).json({ error: 'Error interno: ' + error.message });
  }
}
