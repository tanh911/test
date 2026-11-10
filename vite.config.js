import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function apiServerPlugin() {
  return {
    name: 'api-server-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url === '/api/send-email' && req.method === 'POST') {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', async () => {
            try {
              const { to, subject, html, from } = JSON.parse(body || '{}');
              const apiKey = process.env.VITE_RESEND_API_KEY || process.env.RESEND_API_KEY || '';
              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Chưa cấu hình VITE_RESEND_API_KEY trong file .env!' }));
                return;
              }

              const rawFrom = from || process.env.VITE_RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || 'no-reply@fuhrerscheinvide.site';
              const matchEmail = rawFrom.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
              const fromAddress = matchEmail ? matchEmail[1] : 'no-reply@fuhrerscheinvide.site';

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
              res.statusCode = resendRes.status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            } catch (err) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message, message: err.message }));
            }
          });
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiServerPlugin()],
  optimizeDeps: {},
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: false,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
  },
})
