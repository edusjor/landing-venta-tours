import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminContext } from '../../../lib/adminContext';
import { ensureAgencySubdomainDomain, getPublicAgencyById, getRequestHostFromNodeRequest } from '../../../lib/publicAgency';
import { prisma } from '../../../lib/prisma';

type AgencyPayload = {
  name?: unknown;
  description?: unknown;
  email?: unknown;
  phone?: unknown;
  whatsapp?: unknown;
  logoUrl?: unknown;
  coverImageUrl?: unknown;
};

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeRequiredString(value: unknown): string {
  return String(value ?? '').trim();
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminContext = await requireAdminContext(req, res);
  if (!adminContext) return;

  const hostHint = getRequestHostFromNodeRequest(req);

  if (req.method === 'GET') {
    await ensureAgencySubdomainDomain({
      id: adminContext.agencyId,
      slug: adminContext.agencySlug,
    }, hostHint);

    const agency = await getPublicAgencyById(adminContext.agencyId, hostHint);
    if (!agency) {
      return res.status(404).json({ error: 'Agencia no encontrada.' });
    }

    return res.status(200).json({
      agency: {
        id: agency.id,
        slug: agency.slug,
        name: agency.name,
        description: agency.description,
        email: agency.email,
        phone: agency.phone,
        whatsapp: agency.whatsapp,
        logoUrl: agency.logoUrl,
        coverImageUrl: agency.coverImageUrl,
        publicHost: agency.publicHost,
        publicUrl: agency.publicUrl,
      },
    });
  }

  if (req.method === 'PUT') {
    const payload = (req.body || {}) as AgencyPayload;
    const name = normalizeRequiredString(payload.name);

    if (!name) {
      return res.status(400).json({ error: 'El nombre comercial es obligatorio.' });
    }

    const updatedAgency = await prisma.agency.update({
      where: { id: adminContext.agencyId },
      data: {
        name,
        description: normalizeOptionalString(payload.description),
        email: normalizeOptionalString(payload.email),
        phone: normalizeOptionalString(payload.phone),
        whatsapp: normalizeOptionalString(payload.whatsapp),
        logoUrl: normalizeOptionalString(payload.logoUrl),
        coverImageUrl: normalizeOptionalString(payload.coverImageUrl),
      },
      select: {
        id: true,
        slug: true,
      },
    });

    await ensureAgencySubdomainDomain(updatedAgency, hostHint);
    const agency = await getPublicAgencyById(updatedAgency.id, hostHint);

    return res.status(200).json({
      ok: true,
      agency: {
        id: agency?.id,
        slug: agency?.slug,
        name: agency?.name,
        description: agency?.description,
        email: agency?.email,
        phone: agency?.phone,
        whatsapp: agency?.whatsapp,
        logoUrl: agency?.logoUrl,
        coverImageUrl: agency?.coverImageUrl,
        publicHost: agency?.publicHost,
        publicUrl: agency?.publicUrl,
      },
    });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}