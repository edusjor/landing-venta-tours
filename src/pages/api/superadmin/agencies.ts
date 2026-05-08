import type { NextApiRequest, NextApiResponse } from 'next';
import { AgencyStatus, AgencyUserRole, SuspendedStorefrontMode } from '@prisma/client';
import { ensureAgencySubdomainDomain, getRequestHostFromNodeRequest } from '../../../lib/publicAgency';
import { normalizeAgencySlug } from '../../../lib/publicAgencyHost';
import { prisma } from '../../../lib/prisma';
import { requireSuperAdminSession } from '../../../lib/superAdminAuth';

type AgencyCreatePayload = {
  name?: unknown;
  slug?: unknown;
  email?: unknown;
  ownerEmail?: unknown;
  ownerName?: unknown;
  internalSubdomain?: unknown;
  status?: unknown;
};

type AgencyPatchPayload = {
  agencyId?: unknown;
  status?: unknown;
  suspendedStorefrontMode?: unknown;
  internalSubdomain?: unknown;
};

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeRequiredString(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeAgencyStatus(value: unknown): AgencyStatus {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === AgencyStatus.INACTIVE) return AgencyStatus.INACTIVE;
  if (normalized === AgencyStatus.SUSPENDED) return AgencyStatus.SUSPENDED;
  return AgencyStatus.ACTIVE;
}

function normalizeSuspendedStorefrontMode(value: unknown): SuspendedStorefrontMode {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === SuspendedStorefrontMode.HIDE) return SuspendedStorefrontMode.HIDE;
  return SuspendedStorefrontMode.BLOCK;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const superAdminSession = requireSuperAdminSession(req, res);
  if (!superAdminSession.ok) return;

  if (req.method === 'GET') {
    try {
      const agencies = await prisma.agency.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          users: {
            orderBy: { createdAt: 'asc' },
            select: {
              id: true,
              email: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
          domains: {
            orderBy: [{ isPrimary: 'desc' }, { id: 'asc' }],
            select: {
              id: true,
              host: true,
              isActive: true,
              isPrimary: true,
              isVerified: true,
              verificationStatus: true,
              verificationCheckedAt: true,
              type: true,
              tlsStatus: true,
              tlsCheckedAt: true,
            },
          },
          _count: {
            select: {
              tours: true,
              reservations: true,
            },
          },
        },
      });

      return res.status(200).json({
        agencies: agencies.map((agency) => ({
          id: agency.id,
          name: agency.name,
          slug: agency.slug,
          internalSubdomain: agency.internalSubdomain,
          email: agency.email,
          status: agency.status,
          suspendedStorefrontMode: agency.suspendedStorefrontMode,
          createdAt: agency.createdAt.toISOString(),
          updatedAt: agency.updatedAt.toISOString(),
          counts: {
            tours: agency._count.tours,
            reservations: agency._count.reservations,
          },
          users: agency.users.map((user) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt.toISOString(),
          })),
          domains: agency.domains,
        })),
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudieron cargar las agencias.', detail });
    }
  }

  if (req.method === 'POST') {
    const payload = (req.body || {}) as AgencyCreatePayload;

    const name = normalizeRequiredString(payload.name);
    const slug = normalizeAgencySlug(payload.slug);
    const email = normalizeOptionalString(payload.email);
    const ownerEmail = normalizeOptionalString(payload.ownerEmail);
    const ownerName = normalizeOptionalString(payload.ownerName);
    const internalSubdomain = normalizeAgencySlug(payload.internalSubdomain);
    const status = normalizeAgencyStatus(payload.status);

    if (!name) {
      return res.status(400).json({ error: 'El nombre de agencia es obligatorio.' });
    }

    if (!slug) {
      return res.status(400).json({ error: 'El slug es obligatorio y debe ser válido.' });
    }

    if (!ownerEmail) {
      return res.status(400).json({ error: 'El usuario owner inicial (correo) es obligatorio.' });
    }

    if (!internalSubdomain) {
      return res.status(400).json({ error: 'El subdominio interno es obligatorio.' });
    }

    try {
      const createdAgency = await prisma.$transaction(async (tx) => {
        const agency = await tx.agency.create({
          data: {
            name,
            slug,
            internalSubdomain,
            email,
            status,
            suspendedStorefrontMode: SuspendedStorefrontMode.BLOCK,
          },
          select: {
            id: true,
            slug: true,
            internalSubdomain: true,
          },
        });

        await tx.user.create({
          data: {
            agencyId: agency.id,
            email: ownerEmail,
            name: ownerName || ownerEmail,
            role: AgencyUserRole.OWNER,
          },
        });

        return agency;
      });

      const hostHint = getRequestHostFromNodeRequest(req);
      await ensureAgencySubdomainDomain({
        id: createdAgency.id,
        slug: createdAgency.slug,
        internalSubdomain: createdAgency.internalSubdomain,
      }, hostHint);

      return res.status(201).json({ ok: true, agencyId: createdAgency.id });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudo crear la agencia.', detail });
    }
  }

  if (req.method === 'PATCH') {
    const payload = (req.body || {}) as AgencyPatchPayload;

    const agencyId = Number(payload.agencyId);
    if (!Number.isFinite(agencyId) || agencyId <= 0) {
      return res.status(400).json({ error: 'agencyId inválido.' });
    }

    const nextStatus = payload.status !== undefined
      ? normalizeAgencyStatus(payload.status)
      : undefined;

    const nextSuspendedStorefrontMode = payload.suspendedStorefrontMode !== undefined
      ? normalizeSuspendedStorefrontMode(payload.suspendedStorefrontMode)
      : undefined;

    const nextInternalSubdomainRaw = payload.internalSubdomain;
    const nextInternalSubdomain = nextInternalSubdomainRaw !== undefined
      ? normalizeAgencySlug(nextInternalSubdomainRaw)
      : undefined;

    if (nextInternalSubdomainRaw !== undefined && !nextInternalSubdomain) {
      return res.status(400).json({ error: 'Subdominio interno inválido.' });
    }

    if (!nextStatus && !nextSuspendedStorefrontMode && !nextInternalSubdomain) {
      return res.status(400).json({ error: 'No hay cambios para aplicar.' });
    }

    try {
      const updatedAgency = await prisma.agency.update({
        where: { id: agencyId },
        data: {
          ...(nextStatus ? { status: nextStatus } : {}),
          ...(nextSuspendedStorefrontMode ? { suspendedStorefrontMode: nextSuspendedStorefrontMode } : {}),
          ...(nextInternalSubdomain ? { internalSubdomain: nextInternalSubdomain } : {}),
        },
        select: {
          id: true,
          slug: true,
          internalSubdomain: true,
        },
      });

      if (nextInternalSubdomain) {
        const hostHint = getRequestHostFromNodeRequest(req);
        await ensureAgencySubdomainDomain({
          id: updatedAgency.id,
          slug: updatedAgency.slug,
          internalSubdomain: updatedAgency.internalSubdomain,
        }, hostHint);
      }

      return res.status(200).json({ ok: true });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudo actualizar la agencia.', detail });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
