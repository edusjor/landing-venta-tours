export const PUBLIC_AGENCY_SLUG_COOKIE = 'public_agency_slug';
export const PUBLIC_ROUTE_KIND_HEADER = 'x-route-kind';
export const PUBLIC_REQUEST_HOST_HEADER = 'x-public-request-host';
export const PUBLIC_AGENCY_SLUG_HEADER = 'x-public-agency-slug';

function removeProtocol(value: string): string {
  return value.replace(/^https?:\/\//i, '');
}

function removeTrailingDot(value: string): string {
  return value.endsWith('.') ? value.slice(0, -1) : value;
}

export function normalizeHost(input: unknown): string {
  const raw = removeTrailingDot(removeProtocol(String(input ?? '').trim().toLowerCase()));
  if (!raw) return '';

  const slashIndex = raw.indexOf('/');
  const hostWithOptionalPort = slashIndex >= 0 ? raw.slice(0, slashIndex) : raw;
  if (!hostWithOptionalPort) return '';

  if (hostWithOptionalPort.startsWith('[')) {
    const closingIndex = hostWithOptionalPort.indexOf(']');
    return closingIndex >= 0 ? hostWithOptionalPort.slice(1, closingIndex) : hostWithOptionalPort;
  }

  const segments = hostWithOptionalPort.split(':');
  if (segments.length > 1 && /^\d+$/.test(segments[segments.length - 1] ?? '')) {
    return segments.slice(0, -1).join(':');
  }

  return hostWithOptionalPort;
}

export function isLocalHost(host: string): boolean {
  const normalizedHost = normalizeHost(host);
  return normalizedHost === 'localhost' || normalizedHost.endsWith('.localhost');
}

export function isIpAddress(host: string): boolean {
  const normalizedHost = normalizeHost(host);
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(normalizedHost) || normalizedHost.includes(':');
}

export function inferPlatformRootDomain(hostHint?: string): string {
  const normalizedHost = normalizeHost(hostHint);
  if (!normalizedHost) return '';
  if (isLocalHost(normalizedHost) || isIpAddress(normalizedHost)) return normalizedHost;

  const labels = normalizedHost.split('.').filter(Boolean);
  if (labels.length <= 2) return normalizedHost;
  return labels.slice(-2).join('.');
}

export function getPlatformRootDomain(hostHint?: string): string {
  const envDomain = normalizeHost(process.env.PLATFORM_ROOT_DOMAIN ?? process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN ?? '');
  if (envDomain) return envDomain;
  return inferPlatformRootDomain(hostHint);
}

export function getInternalAgencySlugFromHost(host: string, rootDomainHint?: string): string | null {
  const normalizedHost = normalizeHost(host);
  const rootDomain = normalizeHost(rootDomainHint) || getPlatformRootDomain(normalizedHost);

  if (!normalizedHost || !rootDomain || normalizedHost === rootDomain) return null;

  const suffix = `.${rootDomain}`;
  if (!normalizedHost.endsWith(suffix)) return null;

  const slug = normalizedHost.slice(0, -suffix.length).trim();
  if (!slug || slug.includes('.')) return null;
  return slug;
}

export function normalizeAgencySlug(input: unknown): string {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function buildAgencySubdomainHost(agencySlug: string, hostHint?: string): string | null {
  const normalizedSlug = normalizeAgencySlug(agencySlug);
  const rootDomain = getPlatformRootDomain(hostHint);
  if (!normalizedSlug || !rootDomain) return null;
  return `${normalizedSlug}.${rootDomain}`;
}

export function buildAbsoluteUrlFromHost(host: string, secureHint?: boolean): string | null {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return null;

  const useHttps = typeof secureHint === 'boolean' ? secureHint : !(isLocalHost(normalizedHost) || isIpAddress(normalizedHost));
  return `${useHttps ? 'https' : 'http'}://${normalizedHost}`;
}

export function getPublicAgencySlugFromCookieHeader(cookieHeader: string | null | undefined): string {
  const raw = String(cookieHeader ?? '');
  if (!raw) return '';

  const segments = raw.split(';').map((segment) => segment.trim()).filter(Boolean);
  const target = segments.find((segment) => segment.startsWith(`${PUBLIC_AGENCY_SLUG_COOKIE}=`));
  if (!target) return '';

  const [, value = ''] = target.split('=');
  return decodeURIComponent(value).trim();
}