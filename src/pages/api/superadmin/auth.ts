import type { NextApiRequest, NextApiResponse } from 'next';
import {
  clearSuperAdminSessionCookie,
  createSuperAdminSessionToken,
  getSuperAdminAuthConfig,
  getSuperAdminAuthMissingEnv,
  getSuperAdminCredentials,
  getSuperAdminSessionFromRequest,
  setSuperAdminSessionCookie,
} from '../../../lib/superAdminAuth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authConfig = getSuperAdminAuthConfig();
  if (!authConfig) {
    return res.status(503).json({
      error: 'Configuración de superadmin incompleta',
      missing: getSuperAdminAuthMissingEnv(),
    });
  }

  if (req.method === 'GET') {
    const session = getSuperAdminSessionFromRequest(req);
    if (!session.ok || !session.username) {
      return res.status(401).json({ ok: false });
    }

    setSuperAdminSessionCookie(res, createSuperAdminSessionToken(session.username));
    return res.status(200).json({ ok: true, username: session.username });
  }

  if (req.method === 'DELETE') {
    clearSuperAdminSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    const { username, password } = req.body ?? {};
    const expected = getSuperAdminCredentials();

    if (!expected || username !== expected.username || password !== expected.password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = createSuperAdminSessionToken(expected.username);
    setSuperAdminSessionCookie(res, token);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
