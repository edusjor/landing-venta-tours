import { prisma } from './prisma';
import {
  DEFAULT_PUBLIC_PAYMENT_OPTIONS,
  normalizePaymentMode,
  paymentModeAllowsGateway,
  paymentModeAllowsManual,
  SUPPORTED_GATEWAY_PROVIDER,
  type AgencyPaymentModeValue,
  type GatewayConfigInput,
  type PublicAgencyPaymentOptions,
} from './paymentSettings';

function normalizeOptionalString(value: unknown): string | null {
  const normalized = String(value ?? '').trim();
  return normalized || null;
}

function normalizeGatewayConfigJson(input: unknown): GatewayConfigInput {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return {
      secretKey: null,
      publicKey: null,
      webhookSecret: null,
    };
  }

  const source = input as {
    secretKey?: unknown;
    publicKey?: unknown;
    webhookSecret?: unknown;
    onvoSecretKey?: unknown;
    onvoPublicKey?: unknown;
    onvoWebhookSecret?: unknown;
  };

  return {
    secretKey: normalizeOptionalString(source.secretKey ?? source.onvoSecretKey),
    publicKey: normalizeOptionalString(source.publicKey ?? source.onvoPublicKey),
    webhookSecret: normalizeOptionalString(source.webhookSecret ?? source.onvoWebhookSecret),
  };
}

export type AgencyPaymentSettingsResolved = {
  agencyId: number;
  paymentMode: AgencyPaymentModeValue;
  gatewayProvider: string | null;
  gatewayConfig: GatewayConfigInput;
  manualPaymentInstructions: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankAccountIban: string | null;
  sinpeMobile: string | null;
  updatedAt: string | null;
};

export function buildDefaultAgencyPaymentSettings(agencyId: number): AgencyPaymentSettingsResolved {
  return {
    agencyId,
    paymentMode: DEFAULT_PUBLIC_PAYMENT_OPTIONS.paymentMode,
    gatewayProvider: DEFAULT_PUBLIC_PAYMENT_OPTIONS.gatewayProvider,
    gatewayConfig: {
      secretKey: null,
      publicKey: null,
      webhookSecret: null,
    },
    manualPaymentInstructions: null,
    bankAccountName: null,
    bankAccountNumber: null,
    bankAccountIban: null,
    sinpeMobile: null,
    updatedAt: null,
  };
}

function toResolvedSettings(agencyId: number, input: {
  paymentMode: unknown;
  gatewayProvider: unknown;
  gatewayConfigJson: unknown;
  manualPaymentInstructions: unknown;
  bankAccountName: unknown;
  bankAccountNumber: unknown;
  bankAccountIban: unknown;
  sinpeMobile: unknown;
  updatedAt: unknown;
}): AgencyPaymentSettingsResolved {
  return {
    agencyId,
    paymentMode: normalizePaymentMode(input.paymentMode),
    gatewayProvider: normalizeOptionalString(input.gatewayProvider) || SUPPORTED_GATEWAY_PROVIDER,
    gatewayConfig: normalizeGatewayConfigJson(input.gatewayConfigJson),
    manualPaymentInstructions: normalizeOptionalString(input.manualPaymentInstructions),
    bankAccountName: normalizeOptionalString(input.bankAccountName),
    bankAccountNumber: normalizeOptionalString(input.bankAccountNumber),
    bankAccountIban: normalizeOptionalString(input.bankAccountIban),
    sinpeMobile: normalizeOptionalString(input.sinpeMobile),
    updatedAt: input.updatedAt instanceof Date ? input.updatedAt.toISOString() : null,
  };
}

export async function getAgencyPaymentSettings(agencyId: number): Promise<AgencyPaymentSettingsResolved> {
  const normalizedAgencyId = Number(agencyId);
  if (!Number.isFinite(normalizedAgencyId) || normalizedAgencyId <= 0) {
    throw new Error('Agency id is required to resolve payment settings');
  }

  const row = await prisma.agencyPaymentSettings.findUnique({
    where: { agencyId: normalizedAgencyId },
    select: {
      paymentMode: true,
      gatewayProvider: true,
      gatewayConfigJson: true,
      manualPaymentInstructions: true,
      bankAccountName: true,
      bankAccountNumber: true,
      bankAccountIban: true,
      sinpeMobile: true,
      updatedAt: true,
    },
  });

  if (!row) {
    return buildDefaultAgencyPaymentSettings(normalizedAgencyId);
  }

  return toResolvedSettings(normalizedAgencyId, row);
}

export function buildPublicAgencyPaymentOptions(settings: AgencyPaymentSettingsResolved): PublicAgencyPaymentOptions {
  const mode = normalizePaymentMode(settings.paymentMode);

  return {
    paymentMode: mode,
    gatewayProvider: settings.gatewayProvider || SUPPORTED_GATEWAY_PROVIDER,
    allowsGateway: paymentModeAllowsGateway(mode),
    allowsManual: paymentModeAllowsManual(mode),
    manualPaymentInstructions: settings.manualPaymentInstructions,
    bankAccountName: settings.bankAccountName,
    bankAccountNumber: settings.bankAccountNumber,
    bankAccountIban: settings.bankAccountIban,
    sinpeMobile: settings.sinpeMobile,
  };
}

export function getOnvoCredentialsFromAgencyPaymentSettings(settings: AgencyPaymentSettingsResolved): {
  provider: string;
  secretKey: string;
  publicKey: string;
  webhookSecret: string;
  hasAgencyConfig: boolean;
} {
  const provider = settings.gatewayProvider || SUPPORTED_GATEWAY_PROVIDER;

  const secretKey = settings.gatewayConfig.secretKey || String(process.env.ONVO_SECRET_KEY ?? '').trim();
  const publicKey = settings.gatewayConfig.publicKey || String(process.env.ONVO_PUBLIC_KEY ?? '').trim();
  const webhookSecret = settings.gatewayConfig.webhookSecret || String(process.env.ONVO_WEBHOOK_SECRET ?? '').trim();

  return {
    provider,
    secretKey,
    publicKey,
    webhookSecret,
    hasAgencyConfig: Boolean(settings.gatewayConfig.secretKey && settings.gatewayConfig.publicKey),
  };
}
