export default async function handler(req, res) {
  // 1. Configuración de CORS (Permite que tu web hable con el backend)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Manejar la petición de verificación (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo aceptamos peticiones POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Usa POST.' });
  }

  try {
    // 2. VERIFICACIÓN DE SEGURIDAD
    // Leemos la clave de las variables de entorno de Vercel
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error('❌ ERROR CRÍTICO: GEMINI_API_KEY no está definida en Vercel.');
      return res.status(500).json({ 
        error: 'Error de configuración del servidor: Falta la API Key. Configúrala en Vercel Settings.' 
      });
    }

    // 3. Preparar mensaje
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { message, system } = body || {};

    if (!message) {
      return res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
    }

    // 4. Conectar con Google Gemini
    // Usamos v1beta para asegurar compatibilidad
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }],
          // Solo enviamos systemInstruction si existe
          ...(system && { systemInstruction: { parts: [{ text: system }] } })
        })
      }
    );

    const data = await response.json();

    // 5. Manejo de errores de Google
    if (!response.ok) {
      console.error('❌ Error devuelto por Google:', JSON.stringify(data, null, 2));
      return res.status(500).json({ 
        error: data.error?.message || 'Error al conectar con la IA de Google.' 
      });
    }

    // 6. Éxito
    const botReply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No pude generar una respuesta.';
    return res.status(200).json({ text: botReply });

  } catch (error) {
    console.error('❌ Error interno:', error);
    return res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
}
