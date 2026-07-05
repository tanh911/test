/**
 * Service gửi email thông báo khi người dùng đăng nhập hệ thống qua Resend API
 */

// Đọc API Key & Email người nhận từ file .env (hoặc cấu hình)
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY || '';
const NOTIFICATION_RECIPIENTS = import.meta.env.VITE_NOTIFICATION_EMAILS
  ? import.meta.env.VITE_NOTIFICATION_EMAILS.split(',').map(e => e.trim())
  : [];

/**
 * Gửi email thông báo đăng nhập
 * @param {Object} userData Thông tin người dùng vừa đăng nhập
 * @param {string} userData.displayName Tên hiển thị người dùng
 * @param {string} userData.email Email người dùng
 * @param {string} userData.loginMethod Phương thức đăng nhập (Email, Google, Facebook)
 */
export const sendLoginNotification = async ({ displayName, email, loginMethod = 'Email' }) => {
  if (!RESEND_API_KEY) {
    console.warn('[Resend Email] Chưa cấu hình VITE_RESEND_API_KEY trong file .env. Bỏ qua gửi email.');
    return { success: false, reason: 'missing_api_key' };
  }

  const recipients = NOTIFICATION_RECIPIENTS.length > 0
    ? NOTIFICATION_RECIPIENTS
    : ['delivered@resend.dev']; // Mặc định Resend sandbox email

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

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Führerschein App <onboarding@resend.dev>',
        to: recipients,
        subject: emailSubject,
        html: emailHtml,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Resend Email Error]', data);
      return { success: false, error: data };
    }

    console.log('[Resend Email Success]', data);
    return { success: true, data };
  } catch (err) {
    console.error('[Resend Network Error]', err);
    return { success: false, error: err.message };
  }
};
