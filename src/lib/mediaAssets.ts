import path from 'path';
import { MediaAssetStatus } from '@prisma/client';
import { prisma } from './prisma';

export function sanitizeUploadRelativePath(input: string): string | null {
  const normalized = path.posix.normalize(String(input ?? '').replace(/\\/g, '/'));
  if (!normalized || normalized.startsWith('..') || normalized.includes('/../')) return null;
  if (normalized.startsWith('/')) return null;
  return normalized;
}

export function getRelativePathFromUploadUrl(url: string): string | null {
  const normalizedUrl = String(url ?? '').trim();
  if (!normalizedUrl.startsWith('/uploads/')) return null;
  return sanitizeUploadRelativePath(normalizedUrl.slice('/uploads/'.length));
}

export function buildUploadUrl(relativePath: string): string {
  const safeRelativePath = sanitizeUploadRelativePath(relativePath);
  if (!safeRelativePath) {
    throw new Error('Invalid upload relative path');
  }
  return `/uploads/${safeRelativePath}`;
}

export async function upsertMediaAsset(input: {
  agencyId: number;
  relativePath: string;
  originalRelativePath?: string | null;
  name?: string | null;
  extension?: string | null;
  mimeType?: string | null;
  size?: number | null;
  status?: MediaAssetStatus;
}): Promise<void> {
  const safeRelativePath = sanitizeUploadRelativePath(input.relativePath);
  if (!safeRelativePath) return;

  const safeOriginalRelativePath = input.originalRelativePath ? sanitizeUploadRelativePath(input.originalRelativePath) : null;
  const name = String(input.name ?? path.posix.basename(safeRelativePath)).trim() || path.posix.basename(safeRelativePath);

  await prisma.mediaAsset.upsert({
    where: {
      agencyId_relativePath: {
        agencyId: input.agencyId,
        relativePath: safeRelativePath,
      },
    },
    update: {
      name,
      originalRelativePath: safeOriginalRelativePath,
      url: buildUploadUrl(safeRelativePath),
      extension: input.extension ?? null,
      mimeType: input.mimeType ?? null,
      size: Number.isFinite(Number(input.size)) ? Number(input.size) : null,
      status: input.status ?? MediaAssetStatus.ACTIVE,
    },
    create: {
      agencyId: input.agencyId,
      name,
      relativePath: safeRelativePath,
      originalRelativePath: safeOriginalRelativePath,
      url: buildUploadUrl(safeRelativePath),
      extension: input.extension ?? null,
      mimeType: input.mimeType ?? null,
      size: Number.isFinite(Number(input.size)) ? Number(input.size) : null,
      status: input.status ?? MediaAssetStatus.ACTIVE,
    },
  });
}