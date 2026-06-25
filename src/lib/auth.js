/**
 * auth.js — Client-side secure auth utilities
 *
 * Password:  PBKDF2-SHA256 (100k iterations) via Web Crypto API
 * Session:   HMAC-SHA256 signed JWT-like token stored in localStorage
 *            (symmetric, app-secret key — suitable for single-device offline app)
 */

// ── Helpers ────────────────────────────────────────────────────────────────

const APP_SECRET = 'fuhrerschein-viet-duc-2025-secret-key';

function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function b64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function b64urlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  return atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), '='));
}

async function hmacSign(payload, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload));
  return bufToHex(sig);
}

// ── Password hashing (PBKDF2-SHA256) ──────────────────────────────────────

/**
 * Hash a password with a random salt.
 * Returns a string: "salt:hash" (both hex).
 */
export async function hashPassword(password) {
  const enc = new TextEncoder();
  const saltBuf = crypto.getRandomValues(new Uint8Array(16));
  const salt = bufToHex(saltBuf);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hash = bufToHex(derived);
  return `${salt}:${hash}`;
}

/**
 * Verify a plaintext password against a stored "salt:hash" string.
 */
export async function verifyPassword(password, stored) {
  const [saltHex, storedHash] = stored.split(':');
  if (!saltHex || !storedHash) return false;

  const enc = new TextEncoder();
  const saltBuf = new Uint8Array(saltHex.match(/.{2}/g).map((b) => parseInt(b, 16)));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derived = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: saltBuf, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const hash = bufToHex(derived);

  // Constant-time comparison
  if (hash.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < hash.length; i++) diff |= hash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  return diff === 0;
}

// ── JWT-like session token (HMAC-SHA256) ──────────────────────────────────

const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function createToken(userPayload) {
  const header = b64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      sub: userPayload.username,
      iat: Date.now(),
      exp: Date.now() + TOKEN_TTL_MS,
      displayName: userPayload.displayName,
      email: userPayload.email,
    })
  );
  const sigInput = `${header}.${payload}`;
  const sig = b64url(await hmacSign(sigInput, APP_SECRET));
  return `${sigInput}.${sig}`;
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expectedSig = b64url(await hmacSign(`${header}.${payload}`, APP_SECRET));
    if (sig !== expectedSig) return null;

    const claims = JSON.parse(b64urlDecode(payload));
    if (Date.now() > claims.exp) return null; // expired
    return claims;
  } catch {
    return null;
  }
}

export function clearToken() {
  localStorage.removeItem('fuhrerschein_token');
  localStorage.removeItem('fuhrerschein_active_session');
}

// ── Password strength checker ──────────────────────────────────────────────

export function checkPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { level: 'weak', label: 'Yếu', color: '#ef4444' };
  if (score <= 3) return { level: 'medium', label: 'Trung bình', color: '#f59e0b' };
  return { level: 'strong', label: 'Mạnh', color: '#22c55e' };
}
