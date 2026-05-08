import { AgencyStatus } from '@prisma/client';
import { prisma } from './prisma';

const DEFAULT_AGENCY_SLUG = String(process.env.DEFAULT_AGENCY_SLUG ?? 'default').trim() || 'default';
const DEFAULT_AGENCY_NAME = String(process.env.DEFAULT_AGENCY_NAME ?? 'Agencia Base').trim() || 'Agencia Base';

type AgencyResolverDb = {
  agency: {
    findUnique: (args: {
      where: { slug: string };
      select: {
        id: true;
        slug: true;
        name: true;
      };
    }) => Promise<{ id: number; slug: string; name: string } | null>;
    upsert: (args: {
      where: { slug: string };
      update: Record<string, never>;
      create: {
        name: string;
        slug: string;
        internalSubdomain: string;
        status: AgencyStatus;
      };
      select: {
        id: true;
        slug: true;
        name: true;
      };
    }) => Promise<{ id: number; slug: string; name: string }>;
  };
};

export function getDefaultAgencySlug(): string {
  return DEFAULT_AGENCY_SLUG;
}

export async function ensureDefaultAgency(db: AgencyResolverDb = prisma): Promise<{ id: number; slug: string; name: string }> {
  return db.agency.upsert({
    where: { slug: DEFAULT_AGENCY_SLUG },
    update: {},
    create: {
      name: DEFAULT_AGENCY_NAME,
      slug: DEFAULT_AGENCY_SLUG,
      internalSubdomain: DEFAULT_AGENCY_SLUG,
      status: AgencyStatus.ACTIVE,
    },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

export async function getDefaultAgencyId(db: AgencyResolverDb = prisma): Promise<number> {
  const agency = await ensureDefaultAgency(db);
  return agency.id;
}

export async function findAgencyBySlug(slug: string, db: AgencyResolverDb = prisma): Promise<{ id: number; slug: string; name: string } | null> {
  const normalizedSlug = String(slug ?? '').trim();
  if (!normalizedSlug) return null;

  return db.agency.findUnique({
    where: { slug: normalizedSlug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });
}

export async function resolveAgencyBySlugOrDefault(slug?: string, db: AgencyResolverDb = prisma): Promise<{ id: number; slug: string; name: string } | null> {
  const normalizedSlug = String(slug ?? '').trim();
  if (!normalizedSlug) {
    return ensureDefaultAgency(db);
  }

  return findAgencyBySlug(normalizedSlug, db);
}

export async function getAgencyIdBySlugOrDefault(slug?: string, db: AgencyResolverDb = prisma): Promise<number | null> {
  const agency = await resolveAgencyBySlugOrDefault(slug, db);
  return agency?.id ?? null;
}