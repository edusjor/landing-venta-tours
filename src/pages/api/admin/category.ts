import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminContext } from '../../../lib/adminContext';
import { prisma } from '../../../lib/prisma';

function getCategoryId(req: NextApiRequest): number {
  const bodyId = Number(req.body?.id);
  if (Number.isFinite(bodyId)) return bodyId;

  const queryId = Number(req.query?.id);
  if (Number.isFinite(queryId)) return queryId;

  return Number.NaN;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PUT' && req.method !== 'DELETE') {
    return res.status(405).end();
  }

  const adminContext = await requireAdminContext(req, res);
  if (!adminContext) return;

  const agencyId = adminContext.agencyId;

  try {
    if (req.method === 'GET') {
      const categories = await prisma.category.findMany({
        where: { agencyId },
        orderBy: { id: 'asc' },
      });

      return res.status(200).json(categories);
    }

    if (req.method === 'POST') {
      const name = String(req.body?.name ?? '').trim();
      if (!name) {
        return res.status(400).json({ error: 'El nombre de categoría es obligatorio' });
      }

      const created = await prisma.category.create({ data: { agencyId, name } });
      return res.status(200).json(created);
    }

    const id = getCategoryId(req);
    if (!Number.isFinite(id)) {
      return res.status(400).json({ error: 'ID de categoría inválido' });
    }

    if (req.method === 'PUT') {
      const name = String(req.body?.name ?? '').trim();
      if (!name) {
        return res.status(400).json({ error: 'El nombre de categoría es obligatorio' });
      }

      const existing = await prisma.category.findFirst({
        where: { id, agencyId },
        select: { id: true },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Categoría no encontrada' });
      }

      const updated = await prisma.category.update({
        where: { id: existing.id },
        data: { name },
      });

      return res.status(200).json(updated);
    }

    const existing = await prisma.category.findFirst({
      where: { id, agencyId },
      select: { id: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Categoría no encontrada' });
    }

    const usedByTours = await prisma.tour.count({ where: { agencyId, categoryId: id } });
    if (usedByTours > 0) {
      return res.status(400).json({ error: 'No puedes eliminar una categoría usada por tours existentes.' });
    }

    await prisma.category.delete({ where: { id: existing.id } });
    return res.status(200).json({ ok: true, deletedId: id });
  } catch {
    return res.status(500).json({ error: 'No se pudo procesar la categoría en la base de datos.' });
  }
}
