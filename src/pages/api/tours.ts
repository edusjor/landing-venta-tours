import type { NextApiRequest, NextApiResponse } from 'next';
import { getEmbeddedTours, isEmbeddedToursModeEnabled } from '../../lib/embeddedTours';
import { isPublicStorefrontBlocked, resolvePublicAgencyFromRequest } from '../../lib/publicAgency';
import { prisma } from '../../lib/prisma';

type TourWithOptionalAvailabilityConfig = {
  id: number;
  slug?: string | null;
  availabilityConfig?: unknown;
};

async function hydrateAvailabilityConfigForTours<T extends TourWithOptionalAvailabilityConfig>(tours: T[]): Promise<T[]> {
  return Promise.all(
    tours.map(async (tour) => {
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
    }),
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (isEmbeddedToursModeEnabled()) {
    return res.status(200).json(getEmbeddedTours());
  }

  const publicAgency = await resolvePublicAgencyFromRequest(req);
  if (!publicAgency) {
    return res.status(200).json([]);
  }
  if (isPublicStorefrontBlocked(publicAgency)) {
    return res.status(423).json({
      error: 'El storefront de esta agencia está temporalmente suspendido.',
      code: 'AGENCY_STOREFRONT_BLOCKED',
    });
  }
  const agencyId = publicAgency.id;

  const tours = await prisma.tour.findMany({
    where: { agencyId },
    include: { category: true, availability: true, agency: { select: { slug: true, name: true } } },
  });
  const toursWithAvailabilityConfig = await hydrateAvailabilityConfigForTours(tours);
  // Prisma ya incluye slug, pero si algún tour no lo tiene, lo forzamos a string vacío para evitar undefined
  const toursWithSlug = toursWithAvailabilityConfig.map((t) => ({ ...t, slug: t.slug || '' }));
  res.status(200).json(toursWithSlug);
}
