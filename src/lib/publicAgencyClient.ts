import { PUBLIC_AGENCY_SLUG_COOKIE } from './publicAgencyHost';

function readCookie(name: string): string {
  if (typeof document === 'undefined') return '';

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = document.cookie.match(new RegExp(`(?:^|; )${escapedName}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function getClientPublicAgencySlug(fallbackSlug?: string | null): string {
  const normalizedFallback = String(fallbackSlug ?? '').trim();
  if (normalizedFallback) return normalizedFallback;
  return readCookie(PUBLIC_AGENCY_SLUG_COOKIE).trim();
}