const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

loadLocalEnvIfPresent();

const { PrismaClient, AgencyDomainType, AgencyStatus, AgencyUserRole, MediaAssetStatus } = require('@prisma/client');

const prisma = new PrismaClient();

const DEFAULT_AGENCY_SLUG = String(process.env.DEFAULT_AGENCY_SLUG || 'default').trim() || 'default';
const DEFAULT_AGENCY_NAME = String(process.env.DEFAULT_AGENCY_NAME || 'Agencia Base').trim() || 'Agencia Base';
const ADMIN_USERNAME = String(process.env.ADMIN_USERNAME || '').trim();
const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');

function loadLocalEnvIfPresent() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;

  const raw = fs.readFileSync(envPath, 'utf8');
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const separatorIndex = trimmed.indexOf('=');
    if (separatorIndex === -1) return;

    const key = trimmed.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) return;

    let value = trimmed.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    process.env[key] = value;
  });
}

function sanitizeUploadRelativePath(input) {
  const normalized = path.posix.normalize(String(input || '').replace(/\\/g, '/'));
  if (!normalized || normalized.startsWith('..') || normalized.includes('/../')) return null;
  if (normalized.startsWith('/')) return null;
  return normalized;
}

function getRelativePathFromUploadUrl(url) {
  const normalizedUrl = String(url || '').trim();
  if (!normalizedUrl.startsWith('/uploads/')) return null;
  return sanitizeUploadRelativePath(normalizedUrl.slice('/uploads/'.length));
}

function buildUploadUrl(relativePath) {
  return `/uploads/${relativePath}`;
}

function normalizeHost(input) {
  return String(input || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//i, '')
    .replace(/\/$/, '')
    .replace(/:\d+$/, '');
}

function getPlatformRootDomain() {
  const fromEnv = normalizeHost(process.env.PLATFORM_ROOT_DOMAIN || process.env.NEXT_PUBLIC_PLATFORM_ROOT_DOMAIN || '');
  return fromEnv || 'localhost';
}

function buildAgencySubdomainHost(slug) {
  const normalizedSlug = String(slug || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/(^-|-$)/g, '');
  if (!normalizedSlug) return null;
  return `${normalizedSlug}.${getPlatformRootDomain()}`;
}

async function walkFiles(rootPath, relativeBase = '') {
  let entries = [];
  try {
    entries = await fsp.readdir(path.join(rootPath, relativeBase), { withFileTypes: true });
  } catch {
    return [];
  }

  const files = [];
  for (const entry of entries) {
    const nextRelative = path.posix.join(relativeBase, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      files.push(...(await walkFiles(rootPath, nextRelative)));
      continue;
    }
    files.push(nextRelative);
  }

  return files;
}

async function ensureDefaultAgency() {
  return prisma.agency.upsert({
    where: { slug: DEFAULT_AGENCY_SLUG },
    update: {},
    create: {
      name: DEFAULT_AGENCY_NAME,
      slug: DEFAULT_AGENCY_SLUG,
      status: AgencyStatus.ACTIVE,
    },
    select: { id: true, slug: true, name: true },
  });
}

async function ensureAgencySubdomain(agency) {
  const host = buildAgencySubdomainHost(agency.slug);
  if (!host) return null;

  await prisma.agencyDomain.updateMany({
    where: {
      agencyId: agency.id,
      type: AgencyDomainType.SUBDOMAIN,
      host: { not: host },
    },
    data: {
      isPrimary: false,
    },
  });

  await prisma.agencyDomain.upsert({
    where: { host },
    update: {
      agencyId: agency.id,
      type: AgencyDomainType.SUBDOMAIN,
      isPrimary: true,
      isVerified: true,
    },
    create: {
      agencyId: agency.id,
      host,
      type: AgencyDomainType.SUBDOMAIN,
      isPrimary: true,
      isVerified: true,
    },
  });

  return host;
}

async function ensureLegacyAdminUser(agencyId) {
  if (!ADMIN_USERNAME) return null;

  return prisma.user.upsert({
    where: {
      agencyId_email: {
        agencyId,
        email: ADMIN_USERNAME,
      },
    },
    update: {},
    create: {
      agencyId,
      email: ADMIN_USERNAME,
      name: ADMIN_USERNAME,
      role: AgencyUserRole.OWNER,
    },
    select: { id: true, email: true },
  });
}

async function backfillAgencyRelations(agencyId) {
  const categoriesResult = await prisma.category.updateMany({
    where: { agencyId },
    data: {},
  }).catch(() => ({ count: 0 }));

  await prisma.$executeRawUnsafe('UPDATE "Category" SET "agencyId" = $1 WHERE "agencyId" IS NULL', agencyId).catch(() => 0);
  await prisma.$executeRawUnsafe('UPDATE "Tour" SET "agencyId" = $1 WHERE "agencyId" IS NULL', agencyId).catch(() => 0);
  await prisma.$executeRawUnsafe('UPDATE "Reservation" SET "agencyId" = $1 WHERE "agencyId" IS NULL', agencyId).catch(() => 0);

  return { categoriesCount: categoriesResult.count };
}

async function upsertMediaAsset(agencyId, relativePath, fileStats, status) {
  const safeRelativePath = sanitizeUploadRelativePath(relativePath);
  if (!safeRelativePath) return false;

  const name = path.posix.basename(safeRelativePath);
  const extension = path.posix.extname(safeRelativePath).toLowerCase() || null;

  await prisma.mediaAsset.upsert({
    where: {
      agencyId_relativePath: {
        agencyId,
        relativePath: safeRelativePath,
      },
    },
    update: {
      name,
      url: buildUploadUrl(safeRelativePath),
      extension,
      size: Number.isFinite(Number(fileStats?.size)) ? Number(fileStats.size) : null,
      status,
    },
    create: {
      agencyId,
      name,
      relativePath: safeRelativePath,
      url: buildUploadUrl(safeRelativePath),
      extension,
      size: Number.isFinite(Number(fileStats?.size)) ? Number(fileStats.size) : null,
      status,
    },
  });

  return true;
}

async function backfillMediaAssets(agencyId) {
  const referencedPaths = new Set();

  const tours = await prisma.tour.findMany({
    where: { agencyId },
    select: { images: true },
  });
  tours.forEach((tour) => {
    (tour.images || []).forEach((url) => {
      const relativePath = getRelativePathFromUploadUrl(url);
      if (relativePath) referencedPaths.add(relativePath);
    });
  });

  const reservations = await prisma.reservation.findMany({
    where: { agencyId },
    select: { sinpeReceiptUrl: true },
  });
  reservations.forEach((reservation) => {
    const relativePath = getRelativePathFromUploadUrl(reservation.sinpeReceiptUrl || '');
    if (relativePath) referencedPaths.add(relativePath);
  });

  const uploadFiles = await walkFiles(UPLOADS_ROOT);
  uploadFiles.forEach((relativePath) => {
    if (relativePath === '.trash/manifest.json') return;
    referencedPaths.add(relativePath);
  });

  let createdOrUpdated = 0;
  for (const relativePath of referencedPaths) {
    const safeRelativePath = sanitizeUploadRelativePath(relativePath);
    if (!safeRelativePath) continue;

    const absolutePath = path.join(UPLOADS_ROOT, safeRelativePath);
    let fileStats = null;
    try {
      fileStats = await fsp.stat(absolutePath);
      if (!fileStats.isFile()) continue;
    } catch {
      continue;
    }

    const status = safeRelativePath.startsWith('.trash/') ? MediaAssetStatus.TRASHED : MediaAssetStatus.ACTIVE;
    const changed = await upsertMediaAsset(agencyId, safeRelativePath, fileStats, status);
    if (changed) createdOrUpdated += 1;
  }

  return createdOrUpdated;
}

async function main() {
  const agency = await ensureDefaultAgency();
  const publicHost = await ensureAgencySubdomain(agency);
  const user = await ensureLegacyAdminUser(agency.id);
  await backfillAgencyRelations(agency.id);
  const mediaAssetsCount = await backfillMediaAssets(agency.id);

  console.log(JSON.stringify({
    ok: true,
    agency,
    publicHost,
    user,
    mediaAssetsCount,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });