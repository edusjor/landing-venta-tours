import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAdminContext } from '../../../lib/adminContext';
import { PAYMENT_METHOD_MANUAL } from '../../../lib/paymentSettings';
import { prisma } from '../../../lib/prisma';

type RecentReservationItem = {
  id: number;
  status: string;
  date: string;
  createdAt: string;
  people: number;
  paymentMethod: string | null;
  totalAmount: number | null;
  tour: {
    id: number;
    title: string;
  } | null;
};

const PENDING_RESERVATION_STATUSES = ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_REVIEW'] as const;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const adminContext = await requireAdminContext(req, res);
  if (!adminContext) return;

  const agencyId = adminContext.agencyId;

  try {
    const [totalTours, totalReservations, pendingReservations, manualPaymentsPendingReview, recentReservations] = await Promise.all([
      prisma.tour.count({ where: { agencyId, isDeleted: false } }),
      prisma.reservation.count({ where: { agencyId } }),
      prisma.reservation.count({
        where: {
          agencyId,
          status: { in: [...PENDING_RESERVATION_STATUSES] },
        },
      }),
      prisma.reservation.count({
        where: {
          agencyId,
          status: { in: ['PENDING_PAYMENT', 'PAYMENT_REVIEW'] },
          OR: [
            { paymentMethod: PAYMENT_METHOD_MANUAL },
            { paymentMethod: { contains: 'sinpe', mode: 'insensitive' } },
          ],
        },
      }),
      prisma.reservation.findMany({
        where: { agencyId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          tour: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
    ]);

    const normalizedRecentReservations: RecentReservationItem[] = recentReservations.map((reservation) => ({
      id: reservation.id,
      status: reservation.status,
      date: reservation.date.toISOString(),
      createdAt: reservation.createdAt.toISOString(),
      people: reservation.people,
      paymentMethod: reservation.paymentMethod,
      totalAmount: Number.isFinite(Number(reservation.totalAmount)) ? Number(reservation.totalAmount) : null,
      tour: reservation.tour ? { id: reservation.tour.id, title: reservation.tour.title } : null,
    }));

    return res.status(200).json({
      summary: {
        totalTours,
        totalReservations,
        pendingReservations,
        manualPaymentsPendingReview,
      },
      recentReservations: normalizedRecentReservations,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudo cargar el resumen de operación.', detail });
  }
}
