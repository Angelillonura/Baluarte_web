import crypto from 'crypto';

const TOKEN_TTL_MS = 10 * 60 * 1000; // 10 minutos
const tokens = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid email' });
  }

  const token = crypto.randomBytes(32).toString('hex');

  tokens.set(token, {
    expires: Date.now() + TOKEN_TTL_MS
  });

  return res.status(200).json({
    token
  });
}

// Limpieza básica
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of tokens.entries()) {
    if (data.expires < now) {
      tokens.delete(token);
    }
  }
}, 60_000);
