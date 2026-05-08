import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import { MediaAssetStatus } from '@prisma/client';
import { requireAdminContext } from '../../../lib/adminContext';
import { buildUploadUrl, sanitizeUploadRelativePath } from '../../../lib/mediaAssets';
import { prisma } from '../../../lib/prisma';

type LinkedTour = {
  id: number;
  title: string;
};

type MediaStatus = 'active' | 'trash';

type MediaItem = {
  id: string;
  status: MediaStatus;
  name: string;
  relativePath: string;
  url: string;
  extension: string;
  size: number;
  updatedAt: string;
  isImage: boolean;
  linkedTours: LinkedTour[];
};

type TrashManifest = Record<
  string,
  {
    originalRelativePath: string;
    trashedAt: string;
  }
>;

const UPLOADS_ROOT = path.join(process.cwd(), 'uploads');
const TRASH_ROOT = path.join(UPLOADS_ROOT, '.trash');
const TRASH_MANIFEST_PATH = path.join(TRASH_ROOT, 'manifest.json');

const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.avif']);

function toPosix(value: string): string {
  return value.replace(/\\/g, '/');
}

function isImageFile(fileName: string): boolean {
  return imageExtensions.has(path.extname(fileName).toLowerCase());
}

function buildItemId(status: MediaStatus, relPath: string): string {
  return `${status}:${relPath}`;
}

function parseItemId(value: unknown): { status: MediaStatus; relPath: string } | null {
  if (typeof value !== 'string') return null;
  const [statusRaw, ...rest] = value.split(':');
  const relRaw = rest.join(':');
  const status: MediaStatus = statusRaw === 'trash' ? 'trash' : statusRaw === 'active' ? 'active' : null as never;
  if (!status) return null;
  const relPath = sanitizeUploadRelativePath(relRaw);
  if (!relPath) return null;
  return { status, relPath };
}

async function readTrashManifest(): Promise<TrashManifest> {
  try {
    const raw = await fs.readFile(TRASH_MANIFEST_PATH, 'utf8');
    const parsed = JSON.parse(raw) as TrashManifest;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return parsed;
  } catch {
    return {};
  }
}

async function writeTrashManifest(manifest: TrashManifest): Promise<void> {
  await fs.mkdir(TRASH_ROOT, { recursive: true });
  await fs.writeFile(TRASH_MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');
}

function getUploadRelPathFromTourImage(value: string): string | null {
  const normalized = String(value || '').trim();
  if (!normalized) return null;
  if (!normalized.startsWith('/uploads/')) return null;
  const rel = sanitizeUploadRelativePath(normalized.slice('/uploads/'.length));
  return rel;
}

async function buildLinkedToursMap(agencyId: number): Promise<Map<string, LinkedTour[]>> {
  const tours = await prisma.tour.findMany({
    where: { agencyId },
    select: {
      id: true,
      title: true,
      images: true,
    },
  });

  const map = new Map<string, LinkedTour[]>();

  tours.forEach((tour) => {
    const linkedTour: LinkedTour = { id: tour.id, title: tour.title };
    (tour.images || []).forEach((image) => {
      const rel = getUploadRelPathFromTourImage(image);
      if (!rel) return;
      const current = map.get(rel) || [];
      map.set(rel, [...current, linkedTour]);
    });
  });

  return map;
}

async function buildActiveItems(agencyId: number, linkedToursMap: Map<string, LinkedTour[]>): Promise<MediaItem[]> {
  const assets = await prisma.mediaAsset.findMany({
    where: { agencyId, status: MediaAssetStatus.ACTIVE },
    orderBy: { updatedAt: 'desc' },
  });

  const itemsByPath = new Map<string, MediaItem>();

  for (const asset of assets) {
    const safeRelativePath = sanitizeUploadRelativePath(asset.relativePath);
    if (!safeRelativePath || safeRelativePath.startsWith('.trash/')) continue;

    const absolutePath = path.join(UPLOADS_ROOT, safeRelativePath);
    let stats;
    try {
      stats = await fs.stat(absolutePath);
      if (!stats.isFile()) continue;
    } catch {
      continue;
    }

    const fileName = asset.name || path.basename(safeRelativePath);
    itemsByPath.set(safeRelativePath, {
      id: buildItemId('active', safeRelativePath),
      status: 'active',
      name: fileName,
      relativePath: safeRelativePath,
      url: buildUploadUrl(safeRelativePath),
      extension: asset.extension || path.extname(fileName).toLowerCase(),
      size: Number.isFinite(Number(asset.size)) ? Number(asset.size) : stats.size,
      updatedAt: asset.updatedAt.toISOString(),
      isImage: isImageFile(fileName),
      linkedTours: linkedToursMap.get(safeRelativePath) || [],
    });
  }

  for (const [safeRelativePath, linkedTours] of linkedToursMap.entries()) {
    if (itemsByPath.has(safeRelativePath)) continue;

    const absolutePath = path.join(UPLOADS_ROOT, safeRelativePath);
    let stats;
    try {
      stats = await fs.stat(absolutePath);
      if (!stats.isFile()) continue;
    } catch {
      continue;
    }

    const fileName = path.basename(safeRelativePath);
    itemsByPath.set(safeRelativePath, {
      id: buildItemId('active', safeRelativePath),
      status: 'active',
      name: fileName,
      relativePath: safeRelativePath,
      url: buildUploadUrl(safeRelativePath),
      extension: path.extname(fileName).toLowerCase(),
      size: stats.size,
      updatedAt: stats.mtime.toISOString(),
      isImage: isImageFile(fileName),
      linkedTours,
    });
  }

  return Array.from(itemsByPath.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function buildTrashItems(agencyId: number, manifest: TrashManifest): Promise<MediaItem[]> {
  const assets = await prisma.mediaAsset.findMany({
    where: { agencyId, status: MediaAssetStatus.TRASHED },
    orderBy: { updatedAt: 'desc' },
  });

  const items: MediaItem[] = [];
  for (const asset of assets) {
    const safeRelativePath = sanitizeUploadRelativePath(asset.relativePath);
    if (!safeRelativePath || !safeRelativePath.startsWith('.trash/')) continue;

    const trashRelativePath = safeRelativePath.slice('.trash/'.length);
    const absolutePath = path.join(UPLOADS_ROOT, safeRelativePath);
    let stats;
    try {
      stats = await fs.stat(absolutePath);
      if (!stats.isFile()) continue;
    } catch {
      continue;
    }

    const fileName = asset.name || path.basename(safeRelativePath);
    items.push({
      id: buildItemId('trash', trashRelativePath),
      status: 'trash',
      name: fileName,
      relativePath: safeRelativePath,
      url: buildUploadUrl(safeRelativePath),
      extension: asset.extension || path.extname(fileName).toLowerCase(),
      size: Number.isFinite(Number(asset.size)) ? Number(asset.size) : stats.size,
      updatedAt: manifest[trashRelativePath]?.trashedAt || asset.updatedAt.toISOString(),
      isImage: isImageFile(fileName),
      linkedTours: [],
    });
  }

  return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function getUniqueRestorePath(originalRelativePath: string): Promise<string> {
  const parsed = path.posix.parse(originalRelativePath);
  const safeDir = parsed.dir || '';
  const safeExt = parsed.ext || '';
  const safeName = parsed.name || 'archivo';

  const firstCandidate = toPosix(path.posix.join(safeDir, `${safeName}${safeExt}`));
  try {
    await fs.access(path.join(UPLOADS_ROOT, firstCandidate));
  } catch {
    return firstCandidate;
  }

  for (let index = 1; index <= 9999; index += 1) {
    const nextCandidate = toPosix(path.posix.join(safeDir, `${safeName}-restaurado-${index}${safeExt}`));
    try {
      await fs.access(path.join(UPLOADS_ROOT, nextCandidate));
    } catch {
      return nextCandidate;
    }
  }

  return toPosix(path.posix.join(safeDir, `${safeName}-restaurado-${Date.now()}${safeExt}`));
}

function parseIdsFromBody(body: unknown): string[] {
  const source = body as { ids?: unknown };
  if (!Array.isArray(source?.ids)) return [];
  return source.ids.filter((item): item is string => typeof item === 'string' && item.length > 0);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const adminContext = await requireAdminContext(req, res);
  if (!adminContext) return;

  const agencyId = adminContext.agencyId;

  if (req.method === 'GET') {
    try {
      const linkedMap = await buildLinkedToursMap(agencyId);
      const manifest = await readTrashManifest();
      const [activeItems, trashItems] = await Promise.all([
        buildActiveItems(agencyId, linkedMap),
        buildTrashItems(agencyId, manifest),
      ]);

      return res.status(200).json({
        items: [...activeItems, ...trashItems],
        summary: {
          active: activeItems.length,
          trash: trashItems.length,
          linked: activeItems.filter((item) => item.linkedTours.length > 0).length,
          unlinked: activeItems.filter((item) => item.linkedTours.length === 0).length,
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Error desconocido';
      return res.status(500).json({ error: 'No se pudo listar los medios.', detail });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const action = String((req.body as { action?: unknown })?.action || '').trim();
  const ids = parseIdsFromBody(req.body);
  if (!action || !ids.length) {
    return res.status(400).json({ error: 'Accion o ids invalidos' });
  }

  try {
    await fs.mkdir(TRASH_ROOT, { recursive: true });
    const manifest = await readTrashManifest();

    if (action === 'trash') {
      let moved = 0;

      for (const itemId of ids) {
        const parsedId = parseItemId(itemId);
        if (!parsedId || parsedId.status !== 'active') continue;

        const sourceAbsPath = path.join(UPLOADS_ROOT, parsedId.relPath);
        const sourceSafe = sanitizeUploadRelativePath(parsedId.relPath);
        if (!sourceSafe) continue;

        let sourceStats;
        try {
          sourceStats = await fs.stat(sourceAbsPath);
          if (!sourceStats.isFile()) continue;
        } catch {
          continue;
        }

        const sourceName = path.basename(sourceSafe);
        const trashRelPath = toPosix(path.posix.join('files', `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sourceName}`));
        const destinationAbsPath = path.join(TRASH_ROOT, trashRelPath);
        const nextRelativePath = toPosix(path.posix.join('.trash', trashRelPath));

        try {
          await fs.mkdir(path.dirname(destinationAbsPath), { recursive: true });
          await fs.rename(sourceAbsPath, destinationAbsPath);
          manifest[trashRelPath] = {
            originalRelativePath: sourceSafe,
            trashedAt: new Date().toISOString(),
          };

          const existingAsset = await prisma.mediaAsset.findFirst({
            where: {
              agencyId,
              OR: [
                { relativePath: sourceSafe },
                { relativePath: nextRelativePath },
                { originalRelativePath: sourceSafe },
              ],
            },
            select: { id: true },
          });

          if (existingAsset) {
            await prisma.mediaAsset.update({
              where: { id: existingAsset.id },
              data: {
                name: sourceName,
                relativePath: nextRelativePath,
                originalRelativePath: sourceSafe,
                url: buildUploadUrl(nextRelativePath),
                extension: path.extname(sourceName).toLowerCase(),
                size: sourceStats.size,
                status: MediaAssetStatus.TRASHED,
              },
            });
          } else {
            await prisma.mediaAsset.create({
              data: {
                agencyId,
                name: sourceName,
                relativePath: nextRelativePath,
                originalRelativePath: sourceSafe,
                url: buildUploadUrl(nextRelativePath),
                extension: path.extname(sourceName).toLowerCase(),
                size: sourceStats.size,
                status: MediaAssetStatus.TRASHED,
              },
            });
          }

          moved += 1;
        } catch {
          // Skip files that fail to move.
        }
      }

      await writeTrashManifest(manifest);
      return res.status(200).json({ ok: true, moved });
    }

    if (action === 'restore') {
      let restored = 0;

      for (const itemId of ids) {
        const parsedId = parseItemId(itemId);
        if (!parsedId || parsedId.status !== 'trash') continue;

        const trashRelPath = parsedId.relPath;
        const sourceAbsPath = path.join(TRASH_ROOT, trashRelPath);
        const originalFromManifest = sanitizeUploadRelativePath(manifest[trashRelPath]?.originalRelativePath || '') || path.basename(trashRelPath);
        const restoreRelPath = await getUniqueRestorePath(originalFromManifest);
        const destinationAbsPath = path.join(UPLOADS_ROOT, restoreRelPath);
        const currentRelativePath = toPosix(path.posix.join('.trash', trashRelPath));

        try {
          await fs.mkdir(path.dirname(destinationAbsPath), { recursive: true });
          await fs.rename(sourceAbsPath, destinationAbsPath);
          delete manifest[trashRelPath];

          const existingAsset = await prisma.mediaAsset.findFirst({
            where: {
              agencyId,
              relativePath: currentRelativePath,
            },
            select: { id: true },
          });

          if (existingAsset) {
            await prisma.mediaAsset.update({
              where: { id: existingAsset.id },
              data: {
                name: path.basename(restoreRelPath),
                relativePath: restoreRelPath,
                originalRelativePath: null,
                url: buildUploadUrl(restoreRelPath),
                extension: path.extname(restoreRelPath).toLowerCase(),
                status: MediaAssetStatus.ACTIVE,
              },
            });
          }

          restored += 1;
        } catch {
          // Skip files that fail to restore.
        }
      }

      await writeTrashManifest(manifest);
      return res.status(200).json({ ok: true, restored });
    }

    if (action === 'delete') {
      let deleted = 0;

      for (const itemId of ids) {
        const parsedId = parseItemId(itemId);
        if (!parsedId || parsedId.status !== 'trash') continue;

        const trashRelPath = parsedId.relPath;
        const targetAbsPath = path.join(TRASH_ROOT, trashRelPath);
        const currentRelativePath = toPosix(path.posix.join('.trash', trashRelPath));

        try {
          await fs.unlink(targetAbsPath);
          delete manifest[trashRelPath];
          await prisma.mediaAsset.deleteMany({
            where: {
              agencyId,
              relativePath: currentRelativePath,
            },
          });
          deleted += 1;
        } catch {
          // Skip files that fail to delete.
        }
      }

      await writeTrashManifest(manifest);
      return res.status(200).json({ ok: true, deleted });
    }

    return res.status(400).json({ error: 'Accion no soportada' });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudo ejecutar la accion sobre medios.', detail });
  }
}
