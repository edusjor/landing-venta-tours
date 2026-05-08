import type { NextApiRequest, NextApiResponse } from 'next';
import { getEmbeddedCategories, isEmbeddedToursModeEnabled } from '../../lib/embeddedTours';
import { isPublicStorefrontBlocked, resolvePublicAgencyFromRequest } from '../../lib/publicAgency';
import { prisma } from '../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (isEmbeddedToursModeEnabled()) {
    return res.status(200).json(getEmbeddedCategories());
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

  const categories = await prisma.category.findMany({
    where: { agencyId },
    orderBy: { id: 'asc' },
  });
  res.status(200).json(categories);
}
