export default async function handler(req, res) {
  // Allow CORS for API route if needed
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

    const fromAddress = from || process.env.VITE_RESEND_FROM_EMAIL || 'Fuhrerschein Viet-Duc <onboarding@resend.dev>';

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
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
    return res.status(500).json({ error: err.message });
  }
}
