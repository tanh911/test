function getCleanEmail(str) {
  if (!str) return 'no-reply@fuhrerscheinvide.site';
  const match = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : 'no-reply@fuhrerscheinvide.site';
}

export default async function handler(req, res) {
  // Allow CORS for API route
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { to, subject, html, from } = body || {};
    const apiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY || '';

    if (!apiKey) {
      return res.status(400).json({ error: 'Chưa cấu hình RESEND_API_KEY trên server!' });
    }

    const rawFrom = from || process.env.VITE_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'no-reply@fuhrerscheinvide.site';
    const cleanFrom = getCleanEmail(rawFrom);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: cleanFrom,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await resendRes.json();
    if (!resendRes.ok) {
      const errMsg = data.message || data.error?.message || JSON.stringify(data);
      return res.status(resendRes.status).json({ error: errMsg, message: errMsg });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message, message: err.message });
  }
}
