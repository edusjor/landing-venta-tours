import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { requireAdminContext } from '../../../lib/adminContext';
import { sendReservationConfirmationEmailByReservationId } from '../../../lib/reservationPayment';
import { getReservationCheckoutDetailsByIds } from '../../../lib/reservationDetails';
import {
  AUDIT_ACTION_MANUAL_PAYMENT_CONFIRMED,
  AUDIT_ENTITY_RESERVATION,
  createAgencyAuditLog,
} from '../../../lib/auditLog';
import {
  normalizePaymentMethod,
  PAYMENT_METHOD_GATEWAY,
  PAYMENT_METHOD_MANUAL,
} from '../../../lib/paymentSettings';

type SortBy = 'createdAt' | 'date';
type SortOrder = 'asc' | 'desc';
type PaymentFilter = 'all' | 'gateway' | 'manual';
type ReservationStatusValue = 'PENDING' | 'PENDING_PAYMENT' | 'PAYMENT_REVIEW' | 'CONFIRMED' | 'CANCELLED' | 'REJECTED';
type StatusFilter = 'all' | 'pending' | 'pending_payment' | 'payment_review' | 'confirmed' | 'cancelled' | 'rejected';

const ALL_MANUAL_STATUSES = new Set<ReservationStatusValue>([
  'PENDING_PAYMENT',
  'PAYMENT_REVIEW',
  'CONFIRMED',
  'REJECTED',
  'CANCELLED',
]);

const ALL_GATEWAY_STATUSES = new Set<ReservationStatusValue>([
  'PENDING',
  'CONFIRMED',
  'CANCELLED',
]);

function normalizeSortBy(value: unknown): SortBy {
  return String(value ?? '').trim() === 'date' ? 'date' : 'createdAt';
}

function normalizeSortOrder(value: unknown): SortOrder {
  return String(value ?? '').trim().toLowerCase() === 'asc' ? 'asc' : 'desc';
}

function normalizePaymentFilter(value: unknown): PaymentFilter {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'gateway' || normalized === 'card') return 'gateway';
  if (normalized === 'manual' || normalized === 'sinpe') return 'manual';
  return 'all';
}

function normalizeStatusFilter(value: unknown): StatusFilter {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'pending') return 'pending';
  if (normalized === 'pending_payment') return 'pending_payment';
  if (normalized === 'payment_review') return 'payment_review';
  if (normalized === 'confirmed' || normalized === 'paid') return 'confirmed';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'rejected') return 'rejected';
  return 'all';
}

function normalizeReservationStatus(value: unknown): ReservationStatusValue | null {
  const normalized = String(value ?? '').trim().toUpperCase();
  if (normalized === 'PENDING') return 'PENDING';
  if (normalized === 'PENDING_PAYMENT') return 'PENDING_PAYMENT';
  if (normalized === 'PAYMENT_REVIEW') return 'PAYMENT_REVIEW';
  if (normalized === 'CONFIRMED') return 'CONFIRMED';
  if (normalized === 'CANCELLED') return 'CANCELLED';
  if (normalized === 'REJECTED') return 'REJECTED';
  return null;
}

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function resolvePaymentKind(paymentMethod: string | null | undefined): 'gateway' | 'manual' {
  const normalized = normalizePaymentMethod(paymentMethod);
  if (normalized === PAYMENT_METHOD_MANUAL) return 'manual';
  if (normalized === PAYMENT_METHOD_GATEWAY) return 'gateway';

  const raw = String(paymentMethod ?? '').trim().toLowerCase();
  if (raw.includes('sinpe')) return 'manual';
  return 'gateway';
}

function buildWhereForStatusFilter(statusFilter: StatusFilter) {
  if (statusFilter === 'pending') {
    return {
      in: ['PENDING', 'PENDING_PAYMENT', 'PAYMENT_REVIEW'] as ReservationStatusValue[],
    };
  }

  if (statusFilter === 'pending_payment') return 'PENDING_PAYMENT';
  if (statusFilter === 'payment_review') return 'PAYMENT_REVIEW';
  if (statusFilter === 'confirmed') return 'CONFIRMED';
  if (statusFilter === 'cancelled') return 'CANCELLED';
  if (statusFilter === 'rejected') return 'REJECTED';
  return undefined;
}

function canTransitionStatus(paymentKind: 'gateway' | 'manual', nextStatus: ReservationStatusValue): boolean {
  if (paymentKind === 'manual') return ALL_MANUAL_STATUSES.has(nextStatus);
  return ALL_GATEWAY_STATUSES.has(nextStatus);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminContext = await requireAdminContext(req, res);
  if (!adminContext) return;

  const agencyId = adminContext.agencyId;

  if (req.method === 'PATCH') {
    const reservationId = Number(req.body?.reservationId);
    const nextStatus = normalizeReservationStatus(req.body?.status);
    const paymentReviewNote = normalizeOptionalString(req.body?.paymentReviewNote);

    if (!Number.isFinite(reservationId) || reservationId <= 0) {
      return res.status(400).json({ error: 'Id de reserva invalido' });
    }

    if (!nextStatus) {
      return res.status(400).json({
        error: 'Estado invalido. Usa PENDING, PENDING_PAYMENT, PAYMENT_REVIEW, CONFIRMED, REJECTED o CANCELLED.',
      });
    }

    try {
      const reservation = await prisma.reservation.findFirst({
        where: { id: reservationId, agencyId },
        select: { id: true, paymentMethod: true, status: true },
      });

      if (!reservation) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const paymentKind = resolvePaymentKind(reservation.paymentMethod);
      if (!canTransitionStatus(paymentKind, nextStatus)) {
        return res.status(400).json({
          error: paymentKind === 'manual'
            ? 'Las reservas manuales no permiten ese estado.'
            : 'Las reservas de pasarela no permiten ese estado.',
        });
      }

      const nextPaid = nextStatus === 'CONFIRMED';
      const updated = await prisma.reservation.update({
        where: { id: reservation.id },
        data: {
          status: nextStatus,
          paid: nextPaid,
          paymentReviewNote,
        },
        select: {
          id: true,
          status: true,
          paid: true,
          paymentReviewNote: true,
        },
      });

      if (nextStatus === 'CONFIRMED' && reservation.status !== 'CONFIRMED') {
        if (paymentKind === 'manual') {
          await createAgencyAuditLog({
            agencyId,
            userId: adminContext.userId,
            action: AUDIT_ACTION_MANUAL_PAYMENT_CONFIRMED,
            entityType: AUDIT_ENTITY_RESERVATION,
            entityId: updated.id,
          });
        }

        await sendReservationConfirmationEmailByReservationId(updated.id).catch(() => null);
      }

      return res.status(200).json({
        ok: true,
        reservationId: updated.id,
        status: updated.status,
        paid: updated.paid,
        paymentReviewNote: updated.paymentReviewNote,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudo actualizar el estado de la reserva.', detail });
    }
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const sortBy = normalizeSortBy(req.query.sortBy);
  const order = normalizeSortOrder(req.query.order);
  const paymentFilter = normalizePaymentFilter(req.query.payment);
  const statusFilter = normalizeStatusFilter(req.query.status);

  try {
    const orderBy = sortBy === 'createdAt' ? { id: order } : { date: order };
    const statusWhere = buildWhereForStatusFilter(statusFilter);

    const reservations = await prisma.reservation.findMany({
      orderBy,
      where: {
        agencyId,
        ...(statusWhere ? { status: statusWhere } : {}),
      },
      include: {
        tour: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const normalizedReservations = reservations
      .map((reservation) => {
        const entry = reservation as Record<string, unknown>;
        const createdAt =
          typeof entry.createdAt === 'string'
            ? entry.createdAt
            : entry.createdAt instanceof Date
              ? entry.createdAt.toISOString()
              : reservation.date.toISOString();

        const sinpeReceiptUrl = typeof entry.sinpeReceiptUrl === 'string' ? entry.sinpeReceiptUrl : null;
        const manualPaymentProofUrl = typeof entry.manualPaymentProofUrl === 'string' ? entry.manualPaymentProofUrl : null;
        const paymentKind = resolvePaymentKind(reservation.paymentMethod);

        return {
          ...reservation,
          createdAt,
          sinpeReceiptUrl,
          manualPaymentProofUrl: manualPaymentProofUrl || sinpeReceiptUrl,
          paymentKind,
        };
      })
      .filter((reservation) => {
        if (paymentFilter === 'all') return true;
        if (paymentFilter === 'manual') return reservation.paymentKind === 'manual';
        return reservation.paymentKind === 'gateway';
      });

    const detailsByReservationId = await getReservationCheckoutDetailsByIds(
      normalizedReservations.map((item) => item.id),
    ).catch(() => new Map());

    const reservationsWithDetails = normalizedReservations.map((item) => {
      const details = detailsByReservationId.get(item.id);
      return {
        ...item,
        packageTitle: details?.packageTitle || null,
        priceBreakdown: details?.priceBreakdown || [],
        totalAmount: Number.isFinite(Number(details?.totalAmount)) ? Number(details?.totalAmount) : null,
      };
    });

    return res.status(200).json({ reservations: reservationsWithDetails, sortBy, order, paymentFilter, statusFilter });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudieron cargar las reservas.', detail });
  }
}
