import { prisma } from './prisma';

export const AUDIT_ENTITY_TOUR = 'TOUR';
export const AUDIT_ENTITY_RESERVATION = 'RESERVATION';

export const AUDIT_ACTION_TOUR_CREATED = 'TOUR_CREATED';
export const AUDIT_ACTION_TOUR_UPDATED = 'TOUR_UPDATED';
export const AUDIT_ACTION_RESERVATION_CREATED = 'RESERVATION_CREATED';
export const AUDIT_ACTION_MANUAL_PAYMENT_CONFIRMED = 'MANUAL_PAYMENT_CONFIRMED';

export async function createAgencyAuditLog(input: {
  agencyId: number;
  userId?: number | null;
  action: string;
  entityType: string;
  entityId?: string | number | null;
}): Promise<void> {
  const agencyId = Number(input.agencyId);
  if (!Number.isFinite(agencyId) || agencyId <= 0) return;

  const userId = Number(input.userId);
  const hasUserId = Number.isFinite(userId) && userId > 0;

  const action = String(input.action ?? '').trim();
  const entityType = String(input.entityType ?? '').trim();
  const entityIdRaw = String(input.entityId ?? '').trim();

  if (!action || !entityType) return;

  await prisma.agencyAuditLog.create({
    data: {
      agencyId,
      userId: hasUserId ? userId : null,
      action,
      entityType,
      entityId: entityIdRaw || null,
    },
  }).catch(() => null);
}
