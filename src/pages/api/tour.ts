import type { NextApiRequest, NextApiResponse } from 'next';
import { buildPublicAgencyPaymentOptions, getAgencyPaymentSettings } from '../../lib/agencyPaymentSettings';
import {
  getEmbeddedPublicPaymentOptions,
  getEmbeddedTourByIdOrSlug,
  isEmbeddedToursModeEnabled,
} from '../../lib/embeddedTours';
import { isPublicStorefrontBlocked, resolvePublicAgencyFromRequest } from '../../lib/publicAgency';
import { prisma } from '../../lib/prisma';

function slugifyTourValue(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

type TourWithOptionalAvailabilityConfig = {
  id: number;
  availabilityConfig?: unknown;
};

async function hydrateAvailabilityConfigIfMissing(tour: TourWithOptionalAvailabilityConfig | null): Promise<TourWithOptionalAvailabilityConfig | null> {
  if (!tour) return null;
  if (tour.availabilityConfig !== undefined && tour.availabilityConfig !== null) return tour;

  try {
    const rows = await prisma.$queryRaw<Array<{ availabilityConfig: unknown }>>`
      SELECT "availabilityConfig"
      FROM "Tour"
      WHERE "id" = ${tour.id}
      LIMIT 1
    `;

    if (!rows[0]) return tour;
    return {
      ...tour,
      availabilityConfig: rows[0].availabilityConfig,
    };
  } catch {
    return tour;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id, slug } = req.query;

  if (isEmbeddedToursModeEnabled()) {
    const parsedId = typeof id === 'string' ? Number(id) : undefined;
    const parsedSlug = typeof slug === 'string' ? slug : undefined;
    const embeddedTour = getEmbeddedTourByIdOrSlug({ id: parsedId, slug: parsedSlug });

    if (!embeddedTour) return res.status(404).json({ error: 'Tour no encontrado' });

    return res.status(200).json({
      ...embeddedTour,
      paymentOptions: getEmbeddedPublicPaymentOptions(),
    });
  }

  const publicAgency = await resolvePublicAgencyFromRequest(req);
  if (!publicAgency) {
    return res.status(404).json({ error: 'Agencia no encontrada' });
  }
  if (isPublicStorefrontBlocked(publicAgency)) {
    return res.status(423).json({
      error: 'El storefront de esta agencia está temporalmente suspendido.',
      code: 'AGENCY_STOREFRONT_BLOCKED',
    });
  }
  const agencyId = publicAgency.id;

  let tour: TourWithOptionalAvailabilityConfig | null = null;

  try {
    if (typeof slug === 'string' && slug.length > 0) {
      // Resolve fast path by slug via SQL to avoid stale Prisma client type issues.
      const directRows = await prisma.$queryRaw<Array<{ id: number }>>`
        SELECT "id"
        FROM "Tour"
        WHERE "slug" = ${slug}
          AND "agencyId" = ${agencyId}
        LIMIT 1
      `;

      let targetId: number | null = directRows[0]?.id ?? null;

      // Backward-compatible fallback for legacy routes where slug came from title.
      if (!targetId) {
        const titleCandidates = await prisma.tour.findMany({
          where: { agencyId },
          select: { id: true, title: true },
        });

        targetId =
          titleCandidates.find((item) => slugifyTourValue(String(item.title ?? '')) === slug)?.id ?? null;
      }

      if (targetId !== null) {
        tour = await prisma.tour.findFirst({
          where: { id: targetId, agencyId },
          include: { category: true, availability: true, agency: { select: { slug: true, name: true } } },
        });
      }
    } else if (typeof id === 'string' && id.length > 0) {
      const parsedId = Number(id);
      if (Number.isFinite(parsedId)) {
        tour = await prisma.tour.findFirst({
          where: { id: parsedId, agencyId },
          include: { category: true, availability: true, agency: { select: { slug: true, name: true } } },
        });
      }
    }

    tour = await hydrateAvailabilityConfigIfMissing(tour);
  } catch {
    return res.status(500).json({ error: 'Error consultando el tour.' });
  }

  if (!tour) return res.status(404).json({ error: 'Tour no encontrado' });
  const paymentSettings = await getAgencyPaymentSettings(agencyId);
  const paymentOptions = buildPublicAgencyPaymentOptions(paymentSettings);

  res.status(200).json({
    ...tour,
    paymentOptions,
  });
}
