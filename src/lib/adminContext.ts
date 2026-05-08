import type { NextApiRequest, NextApiResponse } from 'next';
import { AgencyStatus, AgencyUserRole } from '@prisma/client';
import {
  createAdminSessionToken,
  getAdminAuthConfig,
  getAdminSessionFromRequest,
  setAdminSessionCookie,
} from './adminAuth';
import { getRequestHostFromNodeRequest } from './publicAgency';
import { getInternalAgencySlugFromHost, normalizeAgencySlug, normalizeHost } from './publicAgencyHost';
import { prisma } from './prisma';

export type AdminAgencyContext = {
  username: string;
  userId: number;
  agencyId: number;
  agencySlug: string;
  agencyName: string;
  agencyStatus: AgencyStatus;
  role: AgencyUserRole;
  isBootstrappedLegacyUser: boolean;
};

type AdminAgencyRecord = {
  id: number;
  slug: string;
  name: string;
  status: AgencyStatus;
};

type AdminAgencyResolutionOptions = {
  requestHost?: string | null;
  preferredAgencySlug?: string | null;
};

const ADMIN_AGENCY_SELECT = {
  id: true,
  slug: true,
  name: true,
  status: true,
} as const;

function normalizeUsername(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeAgencyLookupSlug(value: unknown): string {
  return normalizeAgencySlug(String(value ?? '').trim());
}

async function findAgencyRecordByNormalizedSlug(slug: string): Promise<AdminAgencyRecord | null> {
  const normalizedSlug = normalizeAgencyLookupSlug(slug);
  if (!normalizedSlug) return null;

  return prisma.agency.findFirst({
    where: {
      OR: [{ slug: normalizedSlug }, { internalSubdomain: normalizedSlug }],
    },
    select: ADMIN_AGENCY_SELECT,
  });
}

async function findAgencyRecordByHost(requestHost?: string | null): Promise<AdminAgencyRecord | null> {
  const normalizedHost = normalizeHost(requestHost ?? '');
  if (!normalizedHost) return null;

  const domainMatch = await prisma.agencyDomain.findFirst({
    where: {
      host: normalizedHost,
      isActive: true,
    },
    select: {
      agency: {
        select: ADMIN_AGENCY_SELECT,
      },
    },
  });

  if (domainMatch?.agency) {
    return domainMatch.agency;
  }

  const hostSlug = getInternalAgencySlugFromHost(normalizedHost);
  if (!hostSlug) return null;
  return findAgencyRecordByNormalizedSlug(hostSlug);
}

async function findUniqueAgencyForAdminUsername(username: string): Promise<AdminAgencyRecord | null> {
  const users = await prisma.user.findMany({
    where: {
      email: username,
    },
    orderBy: {
      id: 'asc',
    },
    take: 2,
    select: {
      agency: {
        select: ADMIN_AGENCY_SELECT,
      },
    },
  });

  if (users.length !== 1) return null;
  return users[0]?.agency ?? null;
}

async function findImplicitAdminFallbackAgency(): Promise<AdminAgencyRecord | null> {
  const configuredSlug = normalizeAgencyLookupSlug(process.env.ADMIN_AGENCY_SLUG ?? '');
  if (configuredSlug) {
    const configuredAgency = await findAgencyRecordByNormalizedSlug(configuredSlug);
    if (configuredAgency) return configuredAgency;
  }

  const agencies = await prisma.agency.findMany({
    orderBy: {
      id: 'asc',
    },
    take: 2,
    select: ADMIN_AGENCY_SELECT,
  });

  if (agencies.length === 1) {
    return agencies[0] ?? null;
  }

  return null;
}

async function resolveAdminAgencyRecord(
  username: string,
  options?: AdminAgencyResolutionOptions,
): Promise<AdminAgencyRecord | null> {
  const preferredAgencySlug = normalizeAgencyLookupSlug(options?.preferredAgencySlug ?? '');
  if (preferredAgencySlug) {
    const preferredAgency = await findAgencyRecordByNormalizedSlug(preferredAgencySlug);
    if (preferredAgency) return preferredAgency;
  }

  const hostAgency = await findAgencyRecordByHost(options?.requestHost);
  if (hostAgency) return hostAgency;

  const uniqueUserAgency = await findUniqueAgencyForAdminUsername(username);
  if (uniqueUserAgency) return uniqueUserAgency;

  return findImplicitAdminFallbackAgency();
}

export async function ensureAdminAgencyContextForUsername(
  username: string,
  options?: AdminAgencyResolutionOptions,
): Promise<AdminAgencyContext> {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) {
    throw new Error('Authenticated admin username is required');
  }

  const agencyRecord = await resolveAdminAgencyRecord(normalizedUsername, options);

  if (!agencyRecord) {
    throw new Error('No se pudo determinar la agencia administrativa. Usa un host de agencia o configura ADMIN_AGENCY_SLUG.');
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      agencyId: agencyRecord.id,
      email: normalizedUsername,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  if (existingUser) {
    return {
      username: normalizedUsername,
      userId: existingUser.id,
      agencyId: agencyRecord.id,
      agencySlug: agencyRecord.slug,
      agencyName: agencyRecord.name,
      agencyStatus: agencyRecord.status,
      role: existingUser.role,
      isBootstrappedLegacyUser: false,
    };
  }

  const createdUser = await prisma.user.create({
    data: {
      agencyId: agencyRecord.id,
      email: normalizedUsername,
      name: normalizedUsername,
      role: AgencyUserRole.OWNER,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });

  return {
    username: normalizedUsername,
    userId: createdUser.id,
    agencyId: agencyRecord.id,
    agencySlug: agencyRecord.slug,
    agencyName: agencyRecord.name,
    agencyStatus: agencyRecord.status,
    role: createdUser.role,
    isBootstrappedLegacyUser: true,
  };
}

export async function getAdminAgencyContextFromRequest(req: NextApiRequest): Promise<AdminAgencyContext | null> {
  const session = getAdminSessionFromRequest(req);
  if (!session.ok || !session.username) return null;

  try {
    return await ensureAdminAgencyContextForUsername(session.username, {
      requestHost: getRequestHostFromNodeRequest(req),
      preferredAgencySlug: session.agencySlug,
    });
  } catch {
    return null;
  }
}

export async function requireAdminContext(req: NextApiRequest, res: NextApiResponse): Promise<AdminAgencyContext | null> {
  if (!getAdminAuthConfig()) {
    res.status(503).json({ error: 'Configuración admin incompleta' });
    return null;
  }

  const session = getAdminSessionFromRequest(req);
  if (!session.ok || !session.username) {
    res.status(401).json({ error: 'No autorizado' });
    return null;
  }

  let context: AdminAgencyContext;

  try {
    context = await ensureAdminAgencyContextForUsername(session.username, {
      requestHost: getRequestHostFromNodeRequest(req),
      preferredAgencySlug: session.agencySlug,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo determinar la agencia administrativa.';
    res.status(409).json({
      error: message,
      code: 'ADMIN_AGENCY_NOT_RESOLVED',
    });
    return null;
  }

  setAdminSessionCookie(res, createAdminSessionToken(session.username, context.agencySlug));

  if (context.agencyStatus === AgencyStatus.SUSPENDED) {
    res.status(423).json({
      error: 'La agencia está suspendida. Contacta al superadmin para reactivar el acceso.',
      code: 'AGENCY_SUSPENDED',
    });
    return null;
  }

  if (context.agencyStatus === AgencyStatus.INACTIVE) {
    res.status(403).json({
      error: 'La agencia está inactiva y no puede acceder al panel administrativo.',
      code: 'AGENCY_INACTIVE',
    });
    return null;
  }

  return context;
}