import crypto from 'crypto';
import type { NextApiRequest, NextApiResponse } from 'next';

const SUPERADMIN_COOKIE_NAME = 'superadmin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 8;

type SuperAdminAuthConfig = {
  sessionSecret: string;
  username: string;
  password: string;
};

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function readCredentialWithFallback(primary: string, fallback: string): string | null {
  return readEnv(primary) || readEnv(fallback);
}

export function getSuperAdminAuthConfig(): SuperAdminAuthConfig | null {
  const sessionSecret = readCredentialWithFallback('SUPERADMIN_SESSION_SECRET', 'ADMIN_SESSION_SECRET');
  const username = readCredentialWithFallback('SUPERADMIN_USERNAME', 'ADMIN_USERNAME');
  const password = readCredentialWithFallback('SUPERADMIN_PASSWORD', 'ADMIN_PASSWORD');

  if (!sessionSecret || !username || !password) return null;
  return { sessionSecret, username, password };
}

export function getSuperAdminAuthMissingEnv(): string[] {
  const missing: string[] = [];

  if (!readCredentialWithFallback('SUPERADMIN_SESSION_SECRET', 'ADMIN_SESSION_SECRET')) {
    missing.push('SUPERADMIN_SESSION_SECRET (or ADMIN_SESSION_SECRET)');
  }
  if (!readCredentialWithFallback('SUPERADMIN_USERNAME', 'ADMIN_USERNAME')) {
    missing.push('SUPERADMIN_USERNAME (or ADMIN_USERNAME)');
  }
  if (!readCredentialWithFallback('SUPERADMIN_PASSWORD', 'ADMIN_PASSWORD')) {
    missing.push('SUPERADMIN_PASSWORD (or ADMIN_PASSWORD)');
  }

  return missing;
}

function signPayload(encodedPayload: string): string {
  const config = getSuperAdminAuthConfig();
  if (!config) {
    throw new Error('Superadmin auth config is incomplete');
  }

  return crypto.createHmac('sha256', config.sessionSecret).update(encodedPayload).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

function parseCookies(rawCookie: string | undefined): Record<string, string> {
  if (!rawCookie) return {};
  return rawCookie.split(';').reduce<Record<string, string>>((acc, part) => {
    const [key, ...rest] = part.trim().split('=');
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join('='));
    return acc;
  }, {});
}

export function createSuperAdminSessionToken(username: string): string {
  const payload = {
    username,
    exp: Date.now() + SESSION_TTL_SECONDS * 1000,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifySuperAdminSessionToken(token: string): { ok: boolean; username?: string } {
  if (!getSuperAdminAuthConfig()) return { ok: false };

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return { ok: false };

  const expectedSignature = signPayload(encodedPayload);
  if (!safeEqual(signature, expectedSignature)) return { ok: false };

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as { username?: string; exp?: number };
    if (!parsed?.username || !parsed?.exp) return { ok: false };
    if (Date.now() > parsed.exp) return { ok: false };
    return { ok: true, username: parsed.username };
  } catch {
    return { ok: false };
  }
}

export function getSuperAdminCredentials(): { username: string; password: string } | null {
  const config = getSuperAdminAuthConfig();
  if (!config) return null;

  return {
    username: config.username,
    password: config.password,
  };
}

export function setSuperAdminSessionCookie(res: NextApiResponse, token: string): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${SUPERADMIN_COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS};${secure ? ' Secure;' : ''}`,
  );
}

export function clearSuperAdminSessionCookie(res: NextApiResponse): void {
  const secure = process.env.NODE_ENV === 'production';
  res.setHeader(
    'Set-Cookie',
    `${SUPERADMIN_COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0;${secure ? ' Secure;' : ''}`,
  );
}

export function getSuperAdminSessionFromRequest(req: NextApiRequest): { ok: boolean; username?: string } {
  const cookies = parseCookies(req.headers.cookie);
  const token = cookies[SUPERADMIN_COOKIE_NAME];
  if (!token) return { ok: false };
  return verifySuperAdminSessionToken(token);
}

export function requireSuperAdminSession(req: NextApiRequest, res: NextApiResponse): { ok: boolean; username?: string } {
  if (!getSuperAdminAuthConfig()) {
    res.status(503).json({
      error: 'Configuración de superadmin incompleta',
      missing: getSuperAdminAuthMissingEnv(),
    });
    return { ok: false };
  }

  const session = getSuperAdminSessionFromRequest(req);
  if (!session.ok || !session.username) {
    res.status(401).json({ error: 'No autorizado' });
    return { ok: false };
  }

  setSuperAdminSessionCookie(res, createSuperAdminSessionToken(session.username));
  return session;
}
