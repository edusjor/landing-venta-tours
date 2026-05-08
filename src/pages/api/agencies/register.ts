import type { NextApiRequest, NextApiResponse } from 'next';
import { AgencyStatus, AgencyUserRole, Prisma, SuspendedStorefrontMode } from '@prisma/client';
import { createAdminSessionToken, getAdminAuthConfig, setAdminSessionCookie } from '../../../lib/adminAuth';
import { hashWeakPassword } from '../../../lib/ownerPassword';
import { ensureAgencySubdomainDomain, getRequestHostFromNodeRequest } from '../../../lib/publicAgency';
import { normalizeAgencySlug } from '../../../lib/publicAgencyHost';
import { prisma } from '../../../lib/prisma';

type RegisterPayload = {
  agencyName?: unknown;
  agencySlug?: unknown;
  ownerName?: unknown;
  ownerEmail?: unknown;
  password?: unknown;
  internalSubdomain?: unknown;
};

function normalizeRequiredText(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeEmail(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeSlugOrEmpty(value: unknown): string {
  return normalizeAgencySlug(String(value ?? '').trim());
}

function normalizePassword(value: unknown): string {
  return String(value ?? '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  const authConfig = getAdminAuthConfig();
  if (!authConfig) {
    return res.status(503).json({
      error: 'No se puede crear sesión todavía. Falta configurar ADMIN_SESSION_SECRET.',
    });
  }

  const payload = (req.body || {}) as RegisterPayload;
  const agencyName = normalizeRequiredText(payload.agencyName);
  const agencySlug = normalizeSlugOrEmpty(payload.agencySlug);
  const ownerName = normalizeRequiredText(payload.ownerName);
  const ownerEmail = normalizeEmail(payload.ownerEmail);
  const password = normalizePassword(payload.password);
  const internalSubdomain = normalizeSlugOrEmpty(payload.internalSubdomain) || agencySlug;

  if (!agencyName) {
    return res.status(400).json({ error: 'El nombre de la agencia es obligatorio.' });
  }

  if (!agencySlug) {
    return res.status(400).json({ error: 'El slug de agencia es obligatorio.' });
  }

  if (!ownerEmail || !isValidEmail(ownerEmail)) {
    return res.status(400).json({ error: 'Debes indicar un correo válido para la cuenta owner.' });
  }

  if (password.length < 4) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres.' });
  }

  if (!internalSubdomain) {
    return res.status(400).json({ error: 'No se pudo generar el subdominio interno.' });
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      const agency = await tx.agency.create({
        data: {
          name: agencyName,
          slug: agencySlug,
          internalSubdomain,
          email: ownerEmail,
          status: AgencyStatus.ACTIVE,
          suspendedStorefrontMode: SuspendedStorefrontMode.BLOCK,
        },
        select: {
          id: true,
          slug: true,
          name: true,
          internalSubdomain: true,
        },
      });

      await tx.user.create({
        data: {
          agencyId: agency.id,
          email: ownerEmail,
          name: ownerName || ownerEmail,
          role: AgencyUserRole.OWNER,
          passwordHash: hashWeakPassword(password),
        },
      });

      return agency;
    });

    await ensureAgencySubdomainDomain(
      {
        id: created.id,
        slug: created.slug,
        internalSubdomain: created.internalSubdomain,
      },
      getRequestHostFromNodeRequest(req),
    );

    const token = createAdminSessionToken(ownerEmail, created.slug);
    setAdminSessionCookie(res, token);

    return res.status(201).json({
      ok: true,
      agency: {
        id: created.id,
        slug: created.slug,
        name: created.name,
      },
      redirectTo: '/admin',
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const target = Array.isArray(error.meta?.target) ? error.meta?.target.join(',') : String(error.meta?.target ?? 'campo único');
      return res.status(409).json({
        error: `Ya existe un registro con ese valor (${target}). Prueba con otro slug/correo/subdominio.`,
      });
    }

    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudo crear la agencia.', detail });
  }
}
