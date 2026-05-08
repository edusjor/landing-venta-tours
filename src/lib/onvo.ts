const ONVO_API_BASE = "https://api.onvopay.com/v1";

export type OnvoCredentials = {
  secretKey?: string | null;
  publicKey?: string | null;
  webhookSecret?: string | null;
};

type OnvoRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
};

export type OnvoPaymentIntent = {
  id: string;
  status: string;
  metadata?: Record<string, string> | null;
};

function getOnvoSecretKey(credentials?: OnvoCredentials): string {
  const key = String(credentials?.secretKey ?? process.env.ONVO_SECRET_KEY ?? '').trim();
  if (!key) {
    throw new Error("ONVO secret key is not configured");
  }
  return key;
}

async function onvoRequest<T>(path: string, options: OnvoRequestOptions = {}, credentials?: OnvoCredentials): Promise<T> {
  const secretKey = getOnvoSecretKey(credentials);
  const response = await fetch(`${ONVO_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const detail = payload && typeof payload === "object" ? JSON.stringify(payload) : response.statusText;
    throw new Error(`ONVO request failed (${response.status}): ${detail}`);
  }

  return (await response.json()) as T;
}

export async function createOnvoPaymentIntent(input: {
  amount: number;
  currency: "USD" | "CRC";
  description: string;
  metadata: Record<string, string>;
}, credentials?: OnvoCredentials): Promise<OnvoPaymentIntent> {
  return onvoRequest<OnvoPaymentIntent>("/payment-intents", {
    method: "POST",
    body: {
      amount: input.amount,
      currency: input.currency,
      description: input.description,
      metadata: input.metadata,
    },
  }, credentials);
}

export async function getOnvoPaymentIntent(id: string, credentials?: OnvoCredentials): Promise<OnvoPaymentIntent> {
  return onvoRequest<OnvoPaymentIntent>(`/payment-intents/${encodeURIComponent(id)}`, {}, credentials);
}

export function getOnvoPublishableKey(credentials?: OnvoCredentials): string {
  const key = String(credentials?.publicKey ?? process.env.ONVO_PUBLIC_KEY ?? '').trim();
  if (!key) {
    throw new Error("ONVO public key is not configured");
  }
  return key;
}

export function getOnvoWebhookSecret(credentials?: OnvoCredentials): string {
  const key = String(credentials?.webhookSecret ?? process.env.ONVO_WEBHOOK_SECRET ?? '').trim();
  return key;
}
