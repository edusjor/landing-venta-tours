import type { NextApiRequest, NextApiResponse } from 'next';
import { getEmbeddedAvailabilityByTourId, isEmbeddedToursModeEnabled } from '../../lib/embeddedTours';
import { isPublicStorefrontBlocked, resolvePublicAgencyFromRequest } from '../../lib/publicAgency';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { tourId } = req.query;
  const parsedTourId = Number(tourId);

  if (!Number.isFinite(parsedTourId) || parsedTourId <= 0) {
    return res.status(400).json({ error: 'tourId invalido' });
  }

  if (isEmbeddedToursModeEnabled()) {
    return res.status(200).json(getEmbeddedAvailabilityByTourId(parsedTourId));
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

  const availability = await prisma.availability.findMany({
    where: {
      tourId: parsedTourId,
      tour: {
        agencyId,
      },
    },
  });
  res.status(200).json(availability);
}
