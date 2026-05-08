import type { NextApiRequest } from 'next';
import {
  AgencyDomainTlsStatus,
  AgencyDomainType,
  AgencyDomainVerificationStatus,
  AgencyStatus,
  SuspendedStorefrontMode,
} from '@prisma/client';
import { prisma } from './prisma';
import {
  buildAbsoluteUrlFromHost,
  buildAgencySubdomainHost,
  getInternalAgencySlugFromHost,
  getPublicAgencySlugFromCookieHeader,
  normalizeHost,
  PUBLIC_AGENCY_SLUG_HEADER,
  PUBLIC_REQUEST_HOST_HEADER,
} from './publicAgencyHost';

type HeaderReader = {
  get(name: string): string | null | undefined;
};

const PUBLIC_AGENCY_SELECT = {
  id: true,
  slug: true,
  internalSubdomain: true,
  name: true,
  email: true,
  phone: true,
  whatsapp: true,
  logoUrl: true,
  coverImageUrl: true,
  description: true,
  status: true,
  suspendedStorefrontMode: true,
} as const;

export type PublicAgencyContext = {
  id: number;
  slug: string;
  internalSubdomain: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  status: AgencyStatus;
  suspendedStorefrontMode: SuspendedStorefrontMode;
  publicHost: string | null;
  publicUrl: string | null;
};

type AgencyShape = {
  id: number;
  slug: string;
  internalSubdomain: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  description: string | null;
  status: AgencyStatus;
  suspendedStorefrontMode: SuspendedStorefrontMode;
};

function toPublicAgencyContext(agency: AgencyShape, publicHost: string | null): PublicAgencyContext {
  return {
    ...agency,
    publicHost,
    publicUrl: publicHost ? buildAbsoluteUrlFromHost(publicHost) : null,
  };
}

function getPreferredSubdomainLabel(agency: { slug: string; internalSubdomain?: string | null }): string {
  const configured = String(agency.internalSubdomain ?? '').trim();
  return configured || agency.slug;
}

function getConfiguredFallbackAgencySlug(): string | null {
  const candidates = [
    process.env.PUBLIC_FALLBACK_AGENCY_SLUG,
    process.env.DEFAULT_PUBLIC_AGENCY_SLUG,
  ];

  for (const candidate of candidates) {
    const normalized = String(candidate ?? '').trim();
    if (normalized) return normalized;
  }

  return null;
}

async function findResolvablePrimaryPublicHost(agencyId: number): Promise<string | null> {
  const domain = await prisma.agencyDomain.findFirst({
    where: {
      agencyId,
      isActive: true,
      OR: [
        {
          type: AgencyDomainType.SUBDOMAIN,
          isVerified: true,
        },
        {
          type: AgencyDomainType.CUSTOM_DOMAIN,
          verificationStatus: AgencyDomainVerificationStatus.VERIFIED,
          tlsStatus: AgencyDomainTlsStatus.ACTIVE,
        },
      ],
    },
    orderBy: [{ isPrimary: 'desc' }, { type: 'asc' }, { id: 'asc' }],
    select: {
      host: true,
    },
  });

  return domain?.host ?? null;
}

function resolveStorefrontVisibility(agency: Pick<AgencyShape, 'status' | 'suspendedStorefrontMode'>): 'active' | 'blocked' | 'hidden' {
  if (agency.status === AgencyStatus.ACTIVE) return 'active';
  if (agency.status === AgencyStatus.SUSPENDED) {
    return agency.suspendedStorefrontMode === SuspendedStorefrontMode.BLOCK ? 'blocked' : 'hidden';
  }
  return 'hidden';
}

export function isPublicStorefrontBlocked(agency: Pick<PublicAgencyContext, 'status' | 'suspendedStorefrontMode'>): boolean {
  return resolveStorefrontVisibility(agency) === 'blocked';
}

function toPublicStorefrontContextIfVisible(agency: AgencyShape | null, publicHost: string | null): PublicAgencyContext | null {
  if (!agency) return null;
  const visibility = resolveStorefrontVisibility(agency);
  if (visibility === 'hidden') return null;
  return toPublicAgencyContext(agency, publicHost);
}

export function getRequestHostFromNodeRequest(req: Pick<NextApiRequest, 'headers'>): string {
  const forwardedHost = req.headers['x-forwarded-host'];
  const forwardedHostValue = Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost;
  const requestHost = req.headers.host;
  const hostValue = Array.isArray(requestHost) ? requestHost[0] : requestHost;
  return normalizeHost(forwardedHostValue || hostValue || '');
}

export function getRequestHostFromHeaders(headers: HeaderReader): string {
  return normalizeHost(
    headers.get(PUBLIC_REQUEST_HOST_HEADER)
      || headers.get('x-forwarded-host')
      || headers.get('host')
      || '',
  );
}

export async function ensureAgencySubdomainDomain(
  agency: Pick<AgencyShape, 'id' | 'slug'> & { internalSubdomain?: string | null },
  hostHint?: string,
): Promise<string | null> {
  const publicHost = buildAgencySubdomainHost(getPreferredSubdomainLabel(agency), hostHint);
  if (!publicHost) return null;

  const activePrimaryCustomDomain = await prisma.agencyDomain.findFirst({
    where: {
      agencyId: agency.id,
      isActive: true,
      type: AgencyDomainType.CUSTOM_DOMAIN,
      isPrimary: true,
      verificationStatus: AgencyDomainVerificationStatus.VERIFIED,
      tlsStatus: AgencyDomainTlsStatus.ACTIVE,
    },
    select: {
      id: true,
    },
  });

  const useSubdomainAsPrimary = !activePrimaryCustomDomain;

  await prisma.agencyDomain.updateMany({
    where: {
      agencyId: agency.id,
      type: AgencyDomainType.SUBDOMAIN,
      isActive: true,
      host: { not: publicHost },
    },
    data: {
      isPrimary: false,
    },
  });

  await prisma.agencyDomain.upsert({
    where: { host: publicHost },
    update: {
      agencyId: agency.id,
      type: AgencyDomainType.SUBDOMAIN,
      isPrimary: useSubdomainAsPrimary,
      isActive: true,
      isVerified: true,
      verificationStatus: AgencyDomainVerificationStatus.VERIFIED,
      verificationRecordType: null,
      verificationRecordName: null,
      verificationRecordValue: null,
      verificationFailureReason: null,
      tlsStatus: AgencyDomainTlsStatus.ACTIVE,
      tlsFailureReason: null,
    },
    create: {
      agencyId: agency.id,
      host: publicHost,
      type: AgencyDomainType.SUBDOMAIN,
      isPrimary: useSubdomainAsPrimary,
      isActive: true,
      isVerified: true,
      verificationStatus: AgencyDomainVerificationStatus.VERIFIED,
      tlsStatus: AgencyDomainTlsStatus.ACTIVE,
    },
  });

  return publicHost;
}

export async function getPublicAgencyById(agencyId: number, hostHint?: string): Promise<PublicAgencyContext | null> {
  const agency = await prisma.agency.findUnique({
    where: { id: agencyId },
    select: PUBLIC_AGENCY_SELECT,
  });

  if (!agency) return null;
  const publicHost = await findResolvablePrimaryPublicHost(agency.id)
    ?? buildAgencySubdomainHost(getPreferredSubdomainLabel(agency), hostHint);
  return toPublicAgencyContext(agency, publicHost);
}

export async function findPublicAgencyBySlug(slug: string, hostHint?: string): Promise<PublicAgencyContext | null> {
  const normalizedSlug = String(slug ?? '').trim();
  if (!normalizedSlug) return null;

  const agency = await prisma.agency.findUnique({
    where: { slug: normalizedSlug },
    select: PUBLIC_AGENCY_SELECT,
  });

  if (!agency) return null;
  const publicHost = await findResolvablePrimaryPublicHost(agency.id)
    ?? buildAgencySubdomainHost(getPreferredSubdomainLabel(agency), hostHint);
  return toPublicAgencyContext(agency, publicHost);
}

export async function resolveAgencyByHost(host: string): Promise<PublicAgencyContext | null> {
  const normalizedHost = normalizeHost(host);
  if (!normalizedHost) return null;

  const domainMatch = await prisma.agencyDomain.findFirst({
    where: {
      host: normalizedHost,
      isActive: true,
      OR: [
        {
          type: AgencyDomainType.SUBDOMAIN,
          isVerified: true,
        },
        {
          type: AgencyDomainType.CUSTOM_DOMAIN,
          verificationStatus: AgencyDomainVerificationStatus.VERIFIED,
          tlsStatus: AgencyDomainTlsStatus.ACTIVE,
        },
      ],
    },
    select: {
      host: true,
      agency: {
        select: PUBLIC_AGENCY_SELECT,
      },
    },
  });

  if (domainMatch?.agency) {
    return toPublicStorefrontContextIfVisible(domainMatch.agency, domainMatch.host);
  }

  const internalSlug = getInternalAgencySlugFromHost(normalizedHost);
  if (!internalSlug) return null;

  const agency = await prisma.agency.findFirst({
    where: {
      OR: [{ slug: internalSlug }, { internalSubdomain: internalSlug }],
    },
    select: PUBLIC_AGENCY_SELECT,
  });

  if (!agency) return null;

  const visibility = resolveStorefrontVisibility(agency);
  if (visibility === 'hidden') return null;

  const ensuredSubdomainHost = await ensureAgencySubdomainDomain(agency, normalizedHost);
  const publicHost = await findResolvablePrimaryPublicHost(agency.id);
  return toPublicAgencyContext(agency, publicHost ?? ensuredSubdomainHost ?? normalizedHost);
}

async function resolveFallbackAgency(
  slug: string | null | undefined,
  hostHint?: string,
  allowPlatformFallback = false,
): Promise<PublicAgencyContext | null> {
  const normalizedSlug = String(slug ?? '').trim();
  if (normalizedSlug) {
    const agency = await findPublicAgencyBySlug(normalizedSlug, hostHint);
    return toPublicStorefrontContextIfVisible(agency, agency?.publicHost ?? null);
  }

  if (!allowPlatformFallback) return null;

  const fallbackSlug = getConfiguredFallbackAgencySlug();
  if (!fallbackSlug) return null;

  const agency = await findPublicAgencyBySlug(fallbackSlug, hostHint);
  return toPublicStorefrontContextIfVisible(agency, agency?.publicHost ?? null);
}

export async function resolvePublicAgencyFromHeaders(
  headers: HeaderReader,
  options?: {
    fallbackSlug?: string | null;
    allowPlatformFallback?: boolean;
    allowDefaultFallback?: boolean;
  },
): Promise<PublicAgencyContext | null> {
  if (!String(process.env.DATABASE_URL ?? '').trim()) {
    return null;
  }

  try {
    const host = getRequestHostFromHeaders(headers);
    const hostMatch = await resolveAgencyByHost(host);
    if (hostMatch) return hostMatch;

    const cookieSlug = getPublicAgencySlugFromCookieHeader(headers.get('cookie'));
    const headerSlug = String(headers.get(PUBLIC_AGENCY_SLUG_HEADER) ?? '').trim();
    const fallbackSlug = options?.fallbackSlug ?? (headerSlug || cookieSlug);
    const allowPlatformFallback = options?.allowPlatformFallback ?? options?.allowDefaultFallback ?? false;
    return resolveFallbackAgency(fallbackSlug, host, allowPlatformFallback);
  } catch (error) {
    console.error('[publicAgency] Failed to resolve agency from headers.', error);
    return null;
  }
}

export async function resolvePublicAgencyFromRequest(
  req: NextApiRequest,
  options?: {
    allowPlatformFallback?: boolean;
    allowDefaultFallback?: boolean;
  },
): Promise<PublicAgencyContext | null> {
  if (!String(process.env.DATABASE_URL ?? '').trim()) {
    return null;
  }

  try {
    const host = getRequestHostFromNodeRequest(req);
    const hostMatch = await resolveAgencyByHost(host);
    if (hostMatch) return hostMatch;

    const querySlug = typeof req.query.agency === 'string' ? req.query.agency : '';
    const allowPlatformFallback = options?.allowPlatformFallback ?? options?.allowDefaultFallback ?? false;
    return resolveFallbackAgency(querySlug, host, allowPlatformFallback);
  } catch (error) {
    console.error('[publicAgency] Failed to resolve agency from request.', error);
    return null;
  }
}