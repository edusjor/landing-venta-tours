import type { NextApiRequest, NextApiResponse } from 'next';
import { getAgencyPaymentSettings } from '../../../lib/agencyPaymentSettings';
import {
  normalizePaymentMode,
  paymentModeAllowsGateway,
  paymentModeAllowsManual,
  SUPPORTED_GATEWAY_PROVIDER,
} from '../../../lib/paymentSettings';
import { requireAdminContext } from '../../../lib/adminContext';
import { prisma } from '../../../lib/prisma';

type PaymentSettingsPayload = {
  paymentMode?: unknown;
  gatewayProvider?: unknown;
  onvoSecretKey?: unknown;
  onvoPublicKey?: unknown;
  onvoWebhookSecret?: unknown;
  manualPaymentInstructions?: unknown;
  bankAccountName?: unknown;
  bankAccountNumber?: unknown;
  bankAccountIban?: unknown;
  sinpeMobile?: unknown;
};

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function toApiResponse(settings: {
  agencyId: number;
  paymentMode: string;
  gatewayProvider: string | null;
  gatewayConfig: {
    secretKey: string | null;
    publicKey: string | null;
    webhookSecret: string | null;
  };
  manualPaymentInstructions: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankAccountIban: string | null;
  sinpeMobile: string | null;
  updatedAt: string | null;
}) {
  return {
    agencyId: settings.agencyId,
    paymentMode: settings.paymentMode,
    gatewayProvider: settings.gatewayProvider,
    onvoSecretKey: settings.gatewayConfig.secretKey,
    onvoPublicKey: settings.gatewayConfig.publicKey,
    onvoWebhookSecret: settings.gatewayConfig.webhookSecret,
    manualPaymentInstructions: settings.manualPaymentInstructions,
    bankAccountName: settings.bankAccountName,
    bankAccountNumber: settings.bankAccountNumber,
    bankAccountIban: settings.bankAccountIban,
    sinpeMobile: settings.sinpeMobile,
    updatedAt: settings.updatedAt,
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminContext = await requireAdminContext(req, res);
  if (!adminContext) return;

  const agencyId = adminContext.agencyId;

  if (req.method === 'GET') {
    const settings = await getAgencyPaymentSettings(agencyId);
    return res.status(200).json({ settings: toApiResponse(settings) });
  }

  if (req.method === 'PUT') {
    const payload = (req.body || {}) as PaymentSettingsPayload;

    const paymentMode = normalizePaymentMode(payload.paymentMode);
    const allowsGateway = paymentModeAllowsGateway(paymentMode);
    const allowsManual = paymentModeAllowsManual(paymentMode);

    const gatewayProvider = normalizeOptionalString(payload.gatewayProvider) || SUPPORTED_GATEWAY_PROVIDER;
    const onvoSecretKey = normalizeOptionalString(payload.onvoSecretKey);
    const onvoPublicKey = normalizeOptionalString(payload.onvoPublicKey);
    const onvoWebhookSecret = normalizeOptionalString(payload.onvoWebhookSecret);

    const manualPaymentInstructions = normalizeOptionalString(payload.manualPaymentInstructions);
    const bankAccountName = normalizeOptionalString(payload.bankAccountName);
    const bankAccountNumber = normalizeOptionalString(payload.bankAccountNumber);
    const bankAccountIban = normalizeOptionalString(payload.bankAccountIban);
    const sinpeMobile = normalizeOptionalString(payload.sinpeMobile);

    if (allowsGateway && (!onvoSecretKey || !onvoPublicKey)) {
      return res.status(400).json({
        error: 'Para activar pasarela debes configurar ONVO secret key y ONVO public key.',
      });
    }

    const hasManualInformation = Boolean(
      manualPaymentInstructions
        || bankAccountName
        || bankAccountNumber
        || bankAccountIban
        || sinpeMobile,
    );

    if (allowsManual && !hasManualInformation) {
      return res.status(400).json({
        error: 'Para activar pago manual debes definir instrucciones o al menos un dato bancario/SINPE.',
      });
    }

    await prisma.agencyPaymentSettings.upsert({
      where: { agencyId },
      update: {
        paymentMode,
        gatewayProvider,
        gatewayConfigJson: {
          secretKey: onvoSecretKey,
          publicKey: onvoPublicKey,
          webhookSecret: onvoWebhookSecret,
        },
        manualPaymentInstructions,
        bankAccountName,
        bankAccountNumber,
        bankAccountIban,
        sinpeMobile,
      },
      create: {
        agencyId,
        paymentMode,
        gatewayProvider,
        gatewayConfigJson: {
          secretKey: onvoSecretKey,
          publicKey: onvoPublicKey,
          webhookSecret: onvoWebhookSecret,
        },
        manualPaymentInstructions,
        bankAccountName,
        bankAccountNumber,
        bankAccountIban,
        sinpeMobile,
      },
    });

    const settings = await getAgencyPaymentSettings(agencyId);
    return res.status(200).json({ ok: true, settings: toApiResponse(settings) });
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}
