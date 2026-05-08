export type AgencyPaymentModeValue = "GATEWAY" | "MANUAL" | "BOTH";

export const PAYMENT_MODE_GATEWAY: AgencyPaymentModeValue = "GATEWAY";
export const PAYMENT_MODE_MANUAL: AgencyPaymentModeValue = "MANUAL";
export const PAYMENT_MODE_BOTH: AgencyPaymentModeValue = "BOTH";

export const SUPPORTED_GATEWAY_PROVIDER = "ONVO";

export const PAYMENT_METHOD_GATEWAY = "Tarjeta de Credito o Debito";
export const PAYMENT_METHOD_MANUAL = "Pago Manual (Transferencia / SINPE)";

export type PublicAgencyPaymentOptions = {
  paymentMode: AgencyPaymentModeValue;
  gatewayProvider: string | null;
  allowsGateway: boolean;
  allowsManual: boolean;
  manualPaymentInstructions: string | null;
  bankAccountName: string | null;
  bankAccountNumber: string | null;
  bankAccountIban: string | null;
  sinpeMobile: string | null;
};

export type GatewayConfigInput = {
  secretKey: string | null;
  publicKey: string | null;
  webhookSecret: string | null;
};

export const DEFAULT_PUBLIC_PAYMENT_OPTIONS: PublicAgencyPaymentOptions = {
  paymentMode: PAYMENT_MODE_BOTH,
  gatewayProvider: SUPPORTED_GATEWAY_PROVIDER,
  allowsGateway: true,
  allowsManual: true,
  manualPaymentInstructions: null,
  bankAccountName: null,
  bankAccountNumber: null,
  bankAccountIban: null,
  sinpeMobile: null,
};

export function normalizePaymentMode(input: unknown): AgencyPaymentModeValue {
  const normalized = String(input ?? "").trim().toUpperCase();
  if (normalized === PAYMENT_MODE_GATEWAY) return PAYMENT_MODE_GATEWAY;
  if (normalized === PAYMENT_MODE_MANUAL) return PAYMENT_MODE_MANUAL;
  return PAYMENT_MODE_BOTH;
}

export function paymentModeAllowsGateway(mode: AgencyPaymentModeValue): boolean {
  return mode === PAYMENT_MODE_GATEWAY || mode === PAYMENT_MODE_BOTH;
}

export function paymentModeAllowsManual(mode: AgencyPaymentModeValue): boolean {
  return mode === PAYMENT_MODE_MANUAL || mode === PAYMENT_MODE_BOTH;
}

export function normalizePaymentMethod(input: unknown): string {
  const raw = String(input ?? "").trim().toLowerCase();
  if (!raw) return PAYMENT_METHOD_GATEWAY;

  const isManual =
    raw.includes("manual")
    || raw.includes("sinpe")
    || raw.includes("transfer")
    || raw.includes("deposit");
  if (isManual) return PAYMENT_METHOD_MANUAL;

  return PAYMENT_METHOD_GATEWAY;
}
