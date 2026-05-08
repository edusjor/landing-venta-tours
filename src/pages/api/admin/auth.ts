import type { NextApiRequest, NextApiResponse } from 'next';
import { AgencyStatus } from '@prisma/client';
import { ensureAdminAgencyContextForUsername, getAdminAgencyContextFromRequest } from '../../../lib/adminContext';
import {
  clearAdminSessionCookie,
  createAdminSessionToken,
  getAdminAuthMissingEnv,
  getAdminCredentials,
  getAdminSessionFromRequest,
  setAdminSessionCookie,
} from '../../../lib/adminAuth';
import { verifyWeakPassword } from '../../../lib/ownerPassword';
import { getInternalAgencySlugFromHost, normalizeAgencySlug } from '../../../lib/publicAgencyHost';
import { prisma } from '../../../lib/prisma';
import { getRequestHostFromNodeRequest } from '../../../lib/publicAgency';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const credentials = getAdminCredentials();
  if (!credentials) {
    return res.status(503).json({
      error: 'Configuración admin incompleta',
      missing: getAdminAuthMissingEnv(),
    });
  }

  if (req.method === 'GET') {
    const session = getAdminSessionFromRequest(req);
    if (!session.ok || !session.username) {
      return res.status(401).json({ ok: false });
    }

    const context = await getAdminAgencyContextFromRequest(req);
    if (!context) {
      return res.status(401).json({ ok: false });
    }

    if (context.agencyStatus === AgencyStatus.SUSPENDED) {
      return res.status(423).json({
        ok: false,
        error: 'La agencia está suspendida. Contacta al superadmin.',
        code: 'AGENCY_SUSPENDED',
      });
    }

    if (context.agencyStatus === AgencyStatus.INACTIVE) {
      return res.status(403).json({
        ok: false,
        error: 'La agencia está inactiva.',
        code: 'AGENCY_INACTIVE',
      });
    }

    // Renovar sesión mientras el admin siga activo
    if (session.username) {
      setAdminSessionCookie(res, createAdminSessionToken(session.username, context.agencySlug));
    }

    return res.status(200).json({
      ok: true,
      username: session.username,
      agency: {
        id: context.agencyId,
        slug: context.agencySlug,
        name: context.agencyName,
      },
      role: context.role,
    });
  }

  if (req.method === 'DELETE') {
    clearAdminSessionCookie(res);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    const { username, password, agencySlug } = req.body ?? {};
    const normalizedUsername = String(username ?? '').trim();
    const providedPassword = String(password ?? '');
    const requestHost = getRequestHostFromNodeRequest(req);
    const hostAgencySlug = getInternalAgencySlugFromHost(requestHost);
    const preferredAgencySlug = normalizeAgencySlug(
      String(typeof agencySlug === 'string' && agencySlug.trim() ? agencySlug : hostAgencySlug ?? '').trim(),
    );

    if (!normalizedUsername || !providedPassword) {
      return res.status(400).json({ error: 'Usuario y contraseña son obligatorios.' });
    }

    const expected = credentials;
    if (normalizedUsername === expected.username && providedPassword === expected.password) {
      let context: Awaited<ReturnType<typeof ensureAdminAgencyContextForUsername>>;
      try {
        context = await ensureAdminAgencyContextForUsername(expected.username, {
          requestHost,
          preferredAgencySlug,
        });
      } catch (error) {
        clearAdminSessionCookie(res);
        const message = error instanceof Error ? error.message : 'No se pudo determinar la agencia administrativa.';
        return res.status(409).json({
          error: message,
          code: 'ADMIN_AGENCY_NOT_RESOLVED',
        });
      }

      if (context.agencyStatus === AgencyStatus.SUSPENDED) {
        clearAdminSessionCookie(res);
        return res.status(423).json({
          error: 'La agencia está suspendida. Contacta al superadmin.',
          code: 'AGENCY_SUSPENDED',
        });
      }

      if (context.agencyStatus === AgencyStatus.INACTIVE) {
        clearAdminSessionCookie(res);
        return res.status(403).json({
          error: 'La agencia está inactiva.',
          code: 'AGENCY_INACTIVE',
        });
      }

      const token = createAdminSessionToken(expected.username, context.agencySlug);
      setAdminSessionCookie(res, token);
      return res.status(200).json({ ok: true });
    }

    const ownerUsers = await prisma.user.findMany({
      where: {
        email: {
          equals: normalizedUsername,
          mode: 'insensitive',
        },
        ...(preferredAgencySlug
          ? {
              agency: {
                OR: [{ slug: preferredAgencySlug }, { internalSubdomain: preferredAgencySlug }],
              },
            }
          : {}),
      },
      take: preferredAgencySlug ? 1 : 2,
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        agency: {
          select: {
            id: true,
            slug: true,
            status: true,
          },
        },
      },
    });

    if (ownerUsers.length === 0) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    if (!preferredAgencySlug && ownerUsers.length > 1) {
      return res.status(409).json({
        error: 'Este correo existe en más de una agencia. Indica el slug de agencia para iniciar sesión.',
        code: 'AGENCY_SLUG_REQUIRED',
      });
    }

    const ownerUser = ownerUsers[0];
    if (!verifyWeakPassword(providedPassword, ownerUser.passwordHash)) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    if (ownerUser.agency.status === AgencyStatus.SUSPENDED) {
      clearAdminSessionCookie(res);
      return res.status(423).json({
        error: 'La agencia está suspendida. Contacta al superadmin.',
        code: 'AGENCY_SUSPENDED',
      });
    }

    if (ownerUser.agency.status === AgencyStatus.INACTIVE) {
      clearAdminSessionCookie(res);
      return res.status(403).json({
        error: 'La agencia está inactiva.',
        code: 'AGENCY_INACTIVE',
      });
    }

    const token = createAdminSessionToken(ownerUser.email, ownerUser.agency.slug);
    setAdminSessionCookie(res, token);
    return res.status(200).json({
      ok: true,
      username: ownerUser.email,
      agency: {
        id: ownerUser.agency.id,
        slug: ownerUser.agency.slug,
      },
    });
  }

  return res.status(405).end();
}
