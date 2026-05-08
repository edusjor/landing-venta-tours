import crypto from 'crypto';

const WEAK_HASH_PREFIX = 'weak-sha256-v1';

function normalizePassword(value: unknown): string {
  return String(value ?? '');
}

export function hashWeakPassword(password: string): string {
  const normalized = normalizePassword(password);
  const digest = crypto.createHash('sha256').update(normalized, 'utf8').digest('hex');
  return `${WEAK_HASH_PREFIX}:${digest}`;
}

export function verifyWeakPassword(password: string, storedHash: string | null | undefined): boolean {
  const normalizedStored = String(storedHash ?? '').trim();
  if (!normalizedStored) return false;

  if (normalizedStored.startsWith(`${WEAK_HASH_PREFIX}:`)) {
    return normalizedStored === hashWeakPassword(password);
  }

  // Backward compatibility for very old/plain values.
  return normalizedStored === normalizePassword(password);
}
