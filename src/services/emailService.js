/**
 * Service gửi email thông báo khi người dùng đăng nhập hệ thống qua Resend API
 */

// Đọc API Key & Email người nhận từ file .env (hoặc cấu hình)
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const NOTIFICATION_RECIPIENTS = import.meta.env.VITE_NOTIFICATION_EMAILS
  ? import.meta.env.VITE_NOTIFICATION_EMAILS.split(',').map(e => e.trim())
  : [];
const RESEND_FROM_EMAIL = import.meta.env.VITE_RESEND_FROM_EMAIL || 'no-reply@fuhrerscheinvide.site';

function getCleanEmail(str) {
  if (!str) return 'no-reply@fuhrerscheinvide.site';
  const match = str.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  return match ? match[1] : 'no-reply@fuhrerscheinvide.site';
}

/**
 * Dispatch email via internal API /api/send-email first (to avoid browser CORS & adblocker NetworkError),
 * falling back to direct Resend fetch if the API endpoint is unavailable.
 */
async function dispatchResendEmail({ to, subject, html, from }) {
  const cleanFrom = getCleanEmail(from || RESEND_FROM_EMAIL);
  const payload = {
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    from: cleanFrom
  };

  // 1. Thử gửi qua API Route nội bộ /api/send-email (Tránh hoàn toàn CORS & Adblocker trên trình duyệt)
  try {
    const apiRes = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (apiRes.ok || apiRes.status !== 404) {
      const data = await apiRes.json();
      if (!apiRes.ok) {
        const errMsg = data.message || data.error?.message || data.error || JSON.stringify(data);
        return { success: false, error: errMsg };
      }
      return { success: true, data };
    }
  } catch (apiErr) {
    console.warn('[EmailService] API route /api/send-email not available, falling back to direct fetch...', apiErr);
  }

  // 2. Fallback sang fetch trực tiếp Resend nếu không gọi được API nội bộ
  if (!RESEND_API_KEY) {
    return { success: false, error: 'Chưa cấu hình VITE_RESEND_API_KEY trong file .env!' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok) {
      const errMsg = data.message || data.error?.message || JSON.stringify(data);
      return { success: false, error: errMsg };
    }
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Gửi email thông báo đăng nhập
 */
export const sendLoginNotification = async ({ displayName, email, loginMethod = 'Email' }) => {
  const recipients = NOTIFICATION_RECIPIENTS.length > 0
    ? NOTIFICATION_RECIPIENTS
    : ['delivered@resend.dev'];

  const now = new Date().toLocaleString('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const emailSubject = `🔔 [Thi Lái Xe] ${displayName || email || 'Người dùng'} vừa đăng nhập`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 550px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1a4a5e; margin-top: 0;">🚗 Thông Báo Đăng Nhập Hệ Thống</h2>
      <p style="font-size: 15px; color: #374151;">Có người dùng vừa đăng nhập vào ứng dụng <strong>Führerschein Việt-Đức</strong>.</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Tên người dùng:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${displayName || 'Chưa cập nhật'}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Email / ID:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${email || 'Khách / Tài khoản thường'}</td>
        </tr>
        <tr style="background-color: #f9fafb;">
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Phương thức:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${loginMethod}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #e5e7eb; font-weight: bold; color: #4b5563;">Thời gian:</td>
          <td style="padding: 10px; border: 1px solid #e5e7eb; color: #111827;">${now} (VN)</td>
        </tr>
      </table>

      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-bottom: 0;">
        Email thông báo tự động từ hệ thống Führerschein Việt-Đức (gửi qua Resend).
      </p>
    </div>
  `;

  return await dispatchResendEmail({
    to: recipients,
    subject: emailSubject,
    html: emailHtml
  });
};

/**
 * Gửi email tùy chỉnh từ Admin Dashboard tới 1 người dùng cụ thể
 */
export const sendCustomEmailToUser = async ({ recipientEmail, subject, messageBody, recipientName = '' }) => {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'Địa chỉ email người nhận không hợp lệ!' };
  }

  const emailSubject = subject || 'Thông báo từ Ban quản trị Führerschein Việt-Đức';
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
      <div style="background-color: #1a4a5e; padding: 16px 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">🚗 Führerschein Việt-Đức</h2>
      </div>
      <div style="padding: 20px 0; color: #374151; font-size: 15px; line-height: 1.6;">
        <p style="margin-top: 0;">Xin chào <strong>${recipientName || recipientEmail}</strong>,</p>
        <div style="white-space: pre-wrap; background-color: #f9fafb; padding: 16px; border-radius: 8px; border-left: 4px solid #2b6f8a; margin: 16px 0;">
${messageBody}
        </div>
        <p style="margin-bottom: 0;">Trân trọng,<br><strong>Ban quản trị Führerschein Việt-Đức</strong></p>
      </div>
      <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; text-align: center;">
        Email này được gửi trực tiếp từ hệ thống quản trị Führerschein Việt-Đức.
      </div>
    </div>
  `;

  return await dispatchResendEmail({
    to: recipientEmail,
    subject: emailSubject,
    html: emailHtml
  });
};

/**
 * Gửi email chào mừng khi người dùng mới đăng ký tài khoản
 */
export const sendWelcomeEmail = async ({ recipientEmail, displayName = '' }) => {
  if (!recipientEmail || !recipientEmail.includes('@')) {
    return { success: false, error: 'Địa chỉ email người nhận không hợp lệ!' };
  }

  const nameGreeting = displayName ? ` ${displayName}` : '';
  const emailHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <title>Cảm ơn bạn đã đăng ký</title>
</head>
<body style="font-family: Arial, sans-serif; background-color:#f4f4f4; margin:0; padding:0;">

  <table align="center" width="600" style="background:#ffffff; margin-top:30px; padding:20px; border-radius:10px;">
    
    <tr>
      <td style="text-align:center;">
        <h2 style="color:#2c3e50;">🎉 Cảm ơn bạn đã đăng ký!</h2>
      </td>
    </tr>

    <tr>
      <td style="padding:10px 20px; font-size:16px; color:#333;">
        <p>Xin chào${nameGreeting},</p>

        <p>
          Cảm ơn bạn đã đăng ký và sử dụng dịch vụ tại <b>fuhrerscheinvide.site</b>.
        </p>

        <p>
          Chúng tôi rất trân trọng sự tin tưởng của bạn khi sử dụng nền tảng này.
        </p>

        <p>
          💡 Mọi góp ý, phản hồi hoặc ý tưởng cải thiện đều rất quan trọng.  
          Những đóng góp của bạn sẽ giúp chúng tôi cải thiện chất lượng dịch vụ tốt hơn cho bạn và những người dùng sau này.
        </p>

        <p>
          Nếu bạn có bất kỳ câu hỏi nào, đừng ngần ngại liên hệ với chúng tôi.
        </p>

        <p style="margin-top:20px;">
          Trân trọng,<br>
          <b>Đội ngũ fuhrerscheinvide.site</b>
        </p>
      </td>
    </tr>

    <tr>
      <td style="text-align:center; font-size:12px; color:#888; padding-top:20px;">
        © 2026 fuhrerscheinvide.site - All rights reserved
      </td>
    </tr>

  </table>

</body>
</html>`;

  return await dispatchResendEmail({
    to: recipientEmail,
    subject: '🎉 Cảm ơn bạn đã đăng ký tài khoản tại fuhrerscheinvide.site',
    html: emailHtml
  });
};
