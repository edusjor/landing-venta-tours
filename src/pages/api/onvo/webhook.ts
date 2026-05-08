import type { NextApiRequest, NextApiResponse } from 'next';
import { getAgencyPaymentSettings, getOnvoCredentialsFromAgencyPaymentSettings } from '../../../lib/agencyPaymentSettings';
import { prisma } from '../../../lib/prisma';
import { finalizeReservationPayment } from '../../../lib/reservationPayment';

type OnvoWebhookBody = {
  type?: unknown;
  data?: {
    id?: unknown;
    paymentIntentId?: unknown;
    reservationId?: unknown;
    metadata?: {
      reservationId?: unknown;
    } | null;
  } | null;
};

function getWebhookSecretFromHeaders(req: NextApiRequest): string {
  const headerValue = req.headers['x-webhook-secret'];
  if (Array.isArray(headerValue)) return String(headerValue[0] ?? '').trim();
  return String(headerValue ?? '').trim();
}

function getPaymentIntentIdFromEvent(body: OnvoWebhookBody): string {
  const eventType = String(body.type ?? '').trim();
  if (eventType !== 'payment-intent.succeeded') return '';

  const source = body.data;
  if (!source || typeof source !== 'object') return '';

  const directId = String(source.id ?? '').trim();
  if (directId) return directId;

  const fallbackId = String(source.paymentIntentId ?? '').trim();
  if (fallbackId) return fallbackId;

  return '';
}

function getReservationIdFromEvent(body: OnvoWebhookBody): number | null {
  const source = body.data;
  if (!source || typeof source !== 'object') return null;

  const directReservationId = Number(source.reservationId);
  if (Number.isFinite(directReservationId) && directReservationId > 0) {
    return directReservationId;
  }

  const metadataReservationId = Number(source.metadata?.reservationId);
  if (Number.isFinite(metadataReservationId) && metadataReservationId > 0) {
    return metadataReservationId;
  }

  return null;
}

async function resolveWebhookSecretForReservation(reservationId: number): Promise<string> {
  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { agencyId: true },
  });

  if (!reservation) return '';
  const paymentSettings = await getAgencyPaymentSettings(reservation.agencyId);
  const credentials = getOnvoCredentialsFromAgencyPaymentSettings(paymentSettings);
  return credentials.webhookSecret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const webhookSecretFromRequest = getWebhookSecretFromHeaders(req);

  const body = (req.body && typeof req.body === 'object' ? req.body : {}) as OnvoWebhookBody;
  const paymentIntentId = getPaymentIntentIdFromEvent(body);
  const reservationIdFromEvent = getReservationIdFromEvent(body);

  if (!paymentIntentId) {
    return res.status(200).json({ ok: true, ignored: true });
  }

  const fallbackWebhookSecret = String(process.env.ONVO_WEBHOOK_SECRET ?? '').trim();
  const expectedWebhookSecret = reservationIdFromEvent
    ? (await resolveWebhookSecretForReservation(reservationIdFromEvent)) || fallbackWebhookSecret
    : fallbackWebhookSecret;

  if (!expectedWebhookSecret) {
    return res.status(500).json({ error: 'Webhook de ONVO no configurado' });
  }

  if (!webhookSecretFromRequest || webhookSecretFromRequest !== expectedWebhookSecret) {
    return res.status(401).json({ error: 'Webhook no autorizado' });
  }

  const result = await finalizeReservationPayment({
    paymentIntentId,
    reservationId: reservationIdFromEvent ?? undefined,
  });
  if (!result.ok && result.pending) {
    return res.status(200).json({ ok: true, pending: true });
  }

  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ ok: true, message: result.message });
}
