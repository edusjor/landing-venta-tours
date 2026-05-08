import type { NextApiRequest, NextApiResponse } from 'next';
import { buildPublicAgencyPaymentOptions, getAgencyPaymentSettings, getOnvoCredentialsFromAgencyPaymentSettings } from '../../lib/agencyPaymentSettings';
import { getEmbeddedTourByIdOrSlug, isEmbeddedToursModeEnabled } from '../../lib/embeddedTours';
import { upsertMediaAsset } from '../../lib/mediaAssets';
import { isPublicStorefrontBlocked, resolvePublicAgencyFromRequest } from '../../lib/publicAgency';
import { prisma } from '../../lib/prisma';
import { createOnvoPaymentIntent, getOnvoPublishableKey } from '../../lib/onvo';
import { normalizePaymentMethod, PAYMENT_METHOD_GATEWAY, PAYMENT_METHOD_MANUAL } from '../../lib/paymentSettings';
import { sendReservationPendingValidationEmailByReservationId } from '../../lib/reservationPayment';
import { saveReservationCheckoutDetails } from '../../lib/reservationDetails';
import {
  AUDIT_ACTION_RESERVATION_CREATED,
  AUDIT_ENTITY_RESERVATION,
  createAgencyAuditLog,
} from '../../lib/auditLog';

type AvailabilityConfig = {
  mode: 'SPECIFIC' | 'OPEN';
  openSchedule: {
    maxPeople: number;
    startTime: string;
    endTime: string;
    intervalMinutes: number;
    useCustomTimes: boolean;
    customTimesText: string;
  };
  dateSchedules: Record<string, string[]>;
};

type TourPriceOption = {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  isBase?: boolean;
};

type TourPackage = {
  id: string;
  title: string;
  description?: string;
  priceOptions: TourPriceOption[];
};

type SelectedPriceInput = {
  id?: unknown;
  quantity?: unknown;
};

const CARD_HOLD_WINDOW_MINUTES = 30;

function normalizeTime24(value: unknown): string | null {
  const trimmed = String(value ?? '').trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function normalizeTimeSlots(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  return Array.from(
    new Set(
      items
        .map((item) => normalizeTime24(item))
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort();
}

function parseCustomTimeSlots(input: string): string[] {
  return Array.from(
    new Set(
      String(input || '')
        .split(/[\n,;]+/)
        .map((item) => normalizeTime24(item))
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort();
}

function toMinutes(time24: string): number {
  const [hours, minutes] = time24.split(':').map(Number);
  return hours * 60 + minutes;
}

function buildIntervalTimeSlots(startTime: string, endTime: string, intervalMinutes: number): string[] {
  const start = normalizeTime24(startTime);
  const end = normalizeTime24(endTime);
  if (!start || !end) return [];

  const safeInterval = Number.isFinite(intervalMinutes) ? Math.floor(intervalMinutes) : 0;
  if (safeInterval <= 0) return [];

  const startMin = toMinutes(start);
  const endMin = toMinutes(end);
  if (startMin > endMin) return [];

  const slots: string[] = [];
  for (let min = startMin; min <= endMin; min += safeInterval) {
    const hours = Math.floor(min / 60);
    const minutes = min % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
  }

  return slots;
}

function normalizeAvailabilityConfig(input: unknown): AvailabilityConfig {
  let parsed: unknown = input;
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input);
    } catch {
      parsed = {};
    }
  }

  const source = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const openSource = source.openSchedule && typeof source.openSchedule === 'object'
    ? (source.openSchedule as Record<string, unknown>)
    : {};
  const dateSchedulesRaw = source.dateSchedules && typeof source.dateSchedules === 'object' && !Array.isArray(source.dateSchedules)
    ? (source.dateSchedules as Record<string, unknown>)
    : {};

  const dateSchedules: Record<string, string[]> = {};
  Object.entries(dateSchedulesRaw).forEach(([key, value]) => {
    dateSchedules[key] = normalizeTimeSlots(value);
  });

  return {
    mode: source.mode === 'OPEN' ? 'OPEN' : 'SPECIFIC',
    openSchedule: {
      maxPeople: Number.isFinite(Number(openSource.maxPeople)) && Number(openSource.maxPeople) > 0 ? Math.floor(Number(openSource.maxPeople)) : 10,
      startTime: normalizeTime24(openSource.startTime) ?? '08:00',
      endTime: normalizeTime24(openSource.endTime) ?? '17:00',
      intervalMinutes:
        Number.isFinite(Number(openSource.intervalMinutes)) && Number(openSource.intervalMinutes) > 0
          ? Math.floor(Number(openSource.intervalMinutes))
          : 30,
      useCustomTimes: Boolean(openSource.useCustomTimes),
      customTimesText: String(openSource.customTimesText ?? ''),
    },
    dateSchedules,
  };
}

function buildOpenScheduleSlots(config: AvailabilityConfig): string[] {
  if (config.openSchedule.useCustomTimes) {
    return parseCustomTimeSlots(config.openSchedule.customTimesText);
  }
  return buildIntervalTimeSlots(config.openSchedule.startTime, config.openSchedule.endTime, config.openSchedule.intervalMinutes);
}

function toDateKey(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeDateKeyInput(value: unknown): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw);
  if (dateOnly) return `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}`;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return toDateKey(parsed);
}

function normalizePriceOptions(items: unknown): TourPriceOption[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const source = item as { id?: unknown; name?: unknown; price?: unknown; isFree?: unknown; isBase?: unknown };
      const id = String(source?.id ?? `price-${index}`).trim();
      const name = String(source?.name ?? '').trim();
      const isFree = Boolean(source?.isFree);
      const isBase = Boolean(source?.isBase);
      const parsedPrice = Number(source?.price);
      const price = isFree ? 0 : parsedPrice;

      return { id, name, price, isFree, isBase };
    })
    .filter((item) => item.id && item.name && (item.isFree || (Number.isFinite(item.price) && item.price >= 0)));
}

function normalizeTourPackages(items: unknown): TourPackage[] {
  if (!Array.isArray(items)) return [];

  return items
    .map((item, index) => {
      const source = item as { id?: unknown; title?: unknown; description?: unknown; priceOptions?: unknown };
      const id = String(source?.id ?? `package-${index}`).trim() || `package-${index}`;
      const title = String(source?.title ?? '').trim();
      const description = String(source?.description ?? '').trim();
      const priceOptions = normalizePriceOptions(source?.priceOptions);
      return { id, title, description, priceOptions };
    })
    .filter((pkg) => pkg.title && pkg.priceOptions.length > 0);
}

function buildNormalizedPackages(tour: { tourPackages?: unknown; priceOptions?: unknown; price?: number }): TourPackage[] {
  const normalizedPackages = normalizeTourPackages(tour.tourPackages);
  if (normalizedPackages.length > 0) return normalizedPackages;

  const legacyOptions = normalizePriceOptions(tour.priceOptions);
  if (legacyOptions.length > 0) {
    return [
      {
        id: 'package-main',
        title: 'Paquete principal',
        description: '',
        priceOptions: legacyOptions,
      },
    ];
  }

  return [];
}

function normalizeSelectedPrices(items: unknown): Map<string, number> {
  const selected = new Map<string, number>();
  if (!Array.isArray(items)) return selected;

  items.forEach((item) => {
    const source = item as SelectedPriceInput;
    const id = String(source.id ?? '').trim();
    const quantity = Math.floor(Number(source.quantity));
    if (!id || !Number.isFinite(quantity) || quantity <= 0) return;
    selected.set(id, quantity);
  });

  return selected;
}

function roundUsd(value: number): number {
  return Math.round(value * 100) / 100;
}

function getCardHoldCutoffDate(): Date {
  return new Date(Date.now() - (CARD_HOLD_WINDOW_MINUTES * 60 * 1000));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  if (isEmbeddedToursModeEnabled()) {
    const reservationId = Math.floor(Date.now() / 1000);
    const normalizedPaymentMethod = normalizePaymentMethod(req.body?.paymentMethod);
    const parsedTourId = Number(req.body?.tourId);
    const embeddedTour = getEmbeddedTourByIdOrSlug({ id: parsedTourId });

    if (!embeddedTour) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }

    if (normalizedPaymentMethod === PAYMENT_METHOD_MANUAL) {
      return res.status(200).json({
        reservationId,
        requiresPayment: false,
        status: 'pending_payment',
        message: 'Reserva demo creada con pago manual pendiente de revision.',
      });
    }

    return res.status(200).json({
      reservationId,
      requiresPayment: false,
      status: 'confirmed',
      message: 'Pago demo aprobado. Reserva confirmada.',
      totalAmount: req.body?.people ? Number(req.body.people) * Number(embeddedTour.price ?? 0) : Number(embeddedTour.price ?? 0),
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
  const {
    tourId,
    availabilityId,
    selectedDate,
    people,
    adults,
    kids,
    name,
    lastName,
    email,
    emailConfirm,
    phone,
    hotel,
    paymentMethod,
    manualPaymentProofUrl,
    sinpeReceiptUrl,
    promoCode,
    scheduleTime,
    selectedPrices,
    packageId,
    packageTitle,
  } = req.body;

  const parsedTourId = Number(tourId);
  const parsedAvailabilityId = Number(availabilityId);
  const selectedDateKey = normalizeDateKeyInput(selectedDate);
  const parsedPeople = Number(people);
  const parsedAdults = Number.isFinite(Number(adults)) ? Number(adults) : null;
  const parsedKids = Number.isFinite(Number(kids)) ? Number(kids) : null;

  if (!Number.isFinite(parsedTourId) || !Number.isFinite(parsedPeople) || parsedPeople <= 0) {
    return res.status(400).json({ error: 'Datos de reserva invalidos' });
  }

  if (typeof name !== 'string' || !name.trim() || typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Nombre y correo son obligatorios' });
  }

  if (typeof email === 'string' && typeof emailConfirm === 'string' && emailConfirm.trim() && email.trim() !== emailConfirm.trim()) {
    return res.status(400).json({ error: 'El correo y su confirmación no coinciden' });
  }

  const normalizedPaymentMethod = normalizePaymentMethod(paymentMethod);

  const normalizedManualPaymentProofUrl = String(manualPaymentProofUrl ?? sinpeReceiptUrl ?? '').trim();
  if (normalizedManualPaymentProofUrl && !normalizedManualPaymentProofUrl.startsWith('/uploads/receipts/')) {
    return res.status(400).json({ error: 'El comprobante manual debe subirse en el módulo de recibos.' });
  }

  const isGatewayPayment = normalizedPaymentMethod === PAYMENT_METHOD_GATEWAY;
  const isManualPayment = normalizedPaymentMethod === PAYMENT_METHOD_MANUAL;

  const selectedPriceMap = normalizeSelectedPrices(selectedPrices);

  try {
    const tourForPricing = await prisma.tour.findFirst({
      where: { id: parsedTourId, agencyId: publicAgency.id },
      select: {
        id: true,
        agencyId: true,
        title: true,
        price: true,
        tourPackages: true,
        priceOptions: true,
      },
    });

    if (!tourForPricing) {
      return res.status(404).json({ error: 'Tour no encontrado' });
    }

    const agencyId = tourForPricing.agencyId;
    const agencyPaymentSettings = await getAgencyPaymentSettings(agencyId);
    const publicPaymentOptions = buildPublicAgencyPaymentOptions(agencyPaymentSettings);

    if (isGatewayPayment && !publicPaymentOptions.allowsGateway) {
      return res.status(400).json({ error: 'Esta agencia no tiene pasarela activa para este tour.' });
    }

    if (isManualPayment && !publicPaymentOptions.allowsManual) {
      return res.status(400).json({ error: 'Esta agencia no tiene pago manual activo para este tour.' });
    }

    const packages = buildNormalizedPackages(tourForPricing);
    const selectedPackage =
      packages.find((pkg) => pkg.id === String(packageId ?? '').trim()) ||
      packages.find((pkg) => pkg.title === String(packageTitle ?? '').trim()) ||
      packages[0];

    if (!selectedPackage) {
      return res.status(400).json({ error: 'No se encontraron opciones de precio para este tour' });
    }

    if (selectedPriceMap.size === 0) {
      const defaultOption = selectedPackage.priceOptions.find((option) => option.isBase) || selectedPackage.priceOptions[0];
      if (defaultOption) {
        selectedPriceMap.set(defaultOption.id, 1);
      }
    }

    const selectedOptionRows = selectedPackage.priceOptions
      .filter((option) => selectedPriceMap.has(option.id))
      .map((option) => ({
        option,
        quantity: selectedPriceMap.get(option.id) ?? 0,
      }));

    if (selectedOptionRows.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos una opcion de precio' });
    }

    const peopleFromPrices = selectedOptionRows.reduce((acc, row) => acc + row.quantity, 0);
    if (peopleFromPrices !== parsedPeople) {
      return res.status(400).json({ error: 'La cantidad de personas no coincide con la seleccion de precios' });
    }

    const subtotal = roundUsd(selectedOptionRows.reduce((acc, row) => acc + row.option.price * row.quantity, 0));
    const serviceFee = roundUsd(subtotal * 0.06);
    const total = roundUsd(subtotal + serviceFee);
    const amountInCents = Math.round(total * 100);
    const isFreeCheckout = amountInCents <= 0;

    const result = await prisma.$transaction(
      async (tx) => {
        const tour = await tx.tour.findFirst({
          where: { id: parsedTourId, agencyId },
          select: { id: true, minPeople: true, availabilityConfig: true },
        });
        if (!tour) {
          return { ok: false as const, error: 'Tour no encontrado' };
        }

        const minimumPeople = Math.max(1, Number(tour.minPeople ?? 1));
        if (parsedPeople < minimumPeople) {
          return {
            ok: false as const,
            error: `Debes reservar mínimo ${minimumPeople} persona${minimumPeople === 1 ? '' : 's'}.`,
          };
        }

        const availabilityConfig = normalizeAvailabilityConfig(tour.availabilityConfig);

        let targetDate: Date | null = null;
        let maxPeople = 0;
        let allowedTimes: string[] = [];

        const hasAvailabilityId = Number.isFinite(parsedAvailabilityId) && parsedAvailabilityId > 0;
        if (hasAvailabilityId) {
          const av = await tx.availability.findUnique({ where: { id: parsedAvailabilityId } });
          if (!av) {
            return { ok: false as const, error: 'No hay disponibilidad' };
          }

          if (av.tourId !== parsedTourId) {
            return { ok: false as const, error: 'La disponibilidad seleccionada no pertenece al tour indicado' };
          }

          targetDate = av.date;
          maxPeople = av.maxPeople;
          const key = toDateKey(av.date);
          allowedTimes = normalizeTimeSlots(availabilityConfig.dateSchedules[key]);
          if (allowedTimes.length === 0 && availabilityConfig.mode === 'OPEN') {
            allowedTimes = buildOpenScheduleSlots(availabilityConfig);
          }
        } else {
          if (!selectedDateKey) {
            return { ok: false as const, error: 'Debes seleccionar una fecha válida' };
          }

          const dateStart = new Date(`${selectedDateKey}T00:00:00.000Z`);
          const dateEnd = new Date(`${selectedDateKey}T23:59:59.999Z`);
          const specificDateAvailability = await tx.availability.findFirst({
            where: {
              tourId: parsedTourId,
              date: {
                gte: dateStart,
                lte: dateEnd,
              },
            },
          });

          if (specificDateAvailability) {
            targetDate = specificDateAvailability.date;
            maxPeople = specificDateAvailability.maxPeople;
            allowedTimes = normalizeTimeSlots(availabilityConfig.dateSchedules[selectedDateKey]);
          } else if (availabilityConfig.mode === 'OPEN') {
            targetDate = new Date(`${selectedDateKey}T09:00:00.000Z`);
            maxPeople = availabilityConfig.openSchedule.maxPeople;
            allowedTimes = buildOpenScheduleSlots(availabilityConfig);
          } else {
            return { ok: false as const, error: 'No hay disponibilidad para la fecha seleccionada' };
          }
        }

        if (!targetDate || maxPeople <= 0) {
          return { ok: false as const, error: 'No hay disponibilidad' };
        }

        const scheduleTimeNormalized = normalizeTime24(scheduleTime);
        if (allowedTimes.length > 0 && (!scheduleTimeNormalized || !allowedTimes.includes(scheduleTimeNormalized))) {
          return { ok: false as const, error: 'El horario seleccionado no está disponible para esa fecha' };
        }

        const activeCardHoldCutoff = getCardHoldCutoffDate();
        const reservationAggregate = await tx.reservation.aggregate({
          _sum: { people: true },
          where: {
            agencyId,
            tourId: parsedTourId,
            date: targetDate,
            OR: [
              { paid: true },
              { status: 'PENDING_PAYMENT' },
              { status: 'PAYMENT_REVIEW' },
              {
                paid: false,
                paymentMethod: PAYMENT_METHOD_GATEWAY,
                createdAt: {
                  gte: activeCardHoldCutoff,
                },
              },
            ],
          },
        });

        const reservedPeople = reservationAggregate._sum.people ?? 0;
        const remaining = maxPeople - reservedPeople;

        if (parsedPeople > remaining) {
          return {
            ok: false as const,
            error: remaining > 0 ? `No hay disponibilidad suficiente. Cupos restantes: ${remaining}` : 'No hay disponibilidad',
          };
        }

        const reservation = await tx.reservation.create({
          data: {
            agencyId,
            tourId: parsedTourId,
            status: isFreeCheckout ? 'CONFIRMED' : isManualPayment ? 'PENDING_PAYMENT' : 'PENDING',
            people: parsedPeople,
            adults: parsedAdults,
            kids: parsedKids,
            date: targetDate,
            name,
            lastName,
            email,
            emailConfirm,
            phone,
            hotel,
            paymentMethod: normalizedPaymentMethod,
            sinpeReceiptUrl: isManualPayment ? normalizedManualPaymentProofUrl || null : null,
            manualPaymentProofUrl: isManualPayment ? normalizedManualPaymentProofUrl || null : null,
            promoCode,
            scheduleTime: scheduleTimeNormalized || scheduleTime,
            paid: isFreeCheckout,
          },
        });

        return { ok: true as const, reservationId: reservation.id };
      },
      {
        isolationLevel: 'Serializable',
      },
    );

    if (!result.ok) {
      return res.status(400).json({ error: result.error });
    }

    const priceBreakdown = selectedOptionRows.map((row) => ({
      id: row.option.id,
      name: row.option.name,
      quantity: row.quantity,
      unitPrice: row.option.price,
      totalPrice: roundUsd(row.option.price * row.quantity),
    }));

    await saveReservationCheckoutDetails({
      reservationId: result.reservationId,
      packageTitle: selectedPackage?.title || null,
      priceBreakdown,
      totalAmount: total,
    }).catch(() => null);

    if (normalizedManualPaymentProofUrl) {
      const receiptRelativePath = normalizedManualPaymentProofUrl.startsWith('/uploads/')
        ? normalizedManualPaymentProofUrl.slice('/uploads/'.length)
        : '';

      if (receiptRelativePath) {
        await upsertMediaAsset({
          agencyId,
          relativePath: receiptRelativePath,
        }).catch(() => null);
      }
    }

    if (isManualPayment && !isFreeCheckout) {
      await createAgencyAuditLog({
        agencyId,
        action: AUDIT_ACTION_RESERVATION_CREATED,
        entityType: AUDIT_ENTITY_RESERVATION,
        entityId: result.reservationId,
      });

      await sendReservationPendingValidationEmailByReservationId(result.reservationId).catch(() => null);
      return res.status(200).json({
        ok: true,
        requiresPayment: false,
        status: 'PENDING_PAYMENT',
        reservationStatus: 'PENDING_PAYMENT',
        reservationId: result.reservationId,
        paymentMethod: PAYMENT_METHOD_MANUAL,
        manualPayment: {
          manualPaymentInstructions: publicPaymentOptions.manualPaymentInstructions,
          bankAccountName: publicPaymentOptions.bankAccountName,
          bankAccountNumber: publicPaymentOptions.bankAccountNumber,
          bankAccountIban: publicPaymentOptions.bankAccountIban,
          sinpeMobile: publicPaymentOptions.sinpeMobile,
        },
        message: 'Reserva recibida. Estado inicial: pendiente de pago manual.',
      });
    }

    if (isFreeCheckout) {
      await createAgencyAuditLog({
        agencyId,
        action: AUDIT_ACTION_RESERVATION_CREATED,
        entityType: AUDIT_ENTITY_RESERVATION,
        entityId: result.reservationId,
      });

      return res.status(200).json({
        ok: true,
        requiresPayment: false,
        status: 'CONFIRMED',
        reservationStatus: 'CONFIRMED',
        reservationId: result.reservationId,
        message: 'Reserva confirmada. No se requiere pago para esta seleccion.',
      });
    }

    try {
      const onvoCredentials = getOnvoCredentialsFromAgencyPaymentSettings(agencyPaymentSettings);
      if (!onvoCredentials.secretKey || !onvoCredentials.publicKey) {
        return res.status(400).json({
          error: 'La pasarela está activa pero faltan credenciales configuradas para esta agencia.',
        });
      }

      const paymentIntent = await createOnvoPaymentIntent({
        amount: amountInCents,
        currency: 'USD',
        description: `Reserva tour ${tourForPricing.title}`,
        metadata: {
          reservationId: String(result.reservationId),
          tourId: String(parsedTourId),
          agencyId: String(agencyId),
          email: String(email),
        },
      }, onvoCredentials);

      const publicKey = getOnvoPublishableKey(onvoCredentials);

      await createAgencyAuditLog({
        agencyId,
        action: AUDIT_ACTION_RESERVATION_CREATED,
        entityType: AUDIT_ENTITY_RESERVATION,
        entityId: result.reservationId,
      });

      return res.status(200).json({
        ok: true,
        requiresPayment: true,
        reservationId: result.reservationId,
        paymentIntentId: paymentIntent.id,
        publicKey,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido al crear payment intent';
      await prisma.reservation.delete({ where: { id: result.reservationId } }).catch(() => null);
      return res.status(502).json({
        error: `No se pudo iniciar el pago en ONVO: ${detail}`,
        detail,
      });
    }
  } catch {
    return res.status(500).json({ error: 'No se pudo completar la reserva' });
  }
}
