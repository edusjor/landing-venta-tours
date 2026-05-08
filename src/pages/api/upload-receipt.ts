import fs from 'fs/promises';
import path from 'path';
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable, { type File as FormidableFile } from 'formidable';
import { upsertMediaAsset } from '../../lib/mediaAssets';
import { isPublicStorefrontBlocked, resolvePublicAgencyFromRequest } from '../../lib/publicAgency';
import { prisma } from '../../lib/prisma';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function parseForm(req: NextApiRequest): Promise<{ fields: formidable.Fields; files: formidable.Files }> {
  const form = formidable({
    multiples: false,
    maxFiles: 1,
    maxFileSize: 10 * 1024 * 1024,
    filter: ({ mimetype }) => typeof mimetype === 'string' && mimetype.startsWith('image/'),
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({ fields, files });
    });
  });
}

function getSafeExtension(file: FormidableFile): string {
  const fromName = path.extname(file.originalFilename || '').toLowerCase();
  if (fromName && /^\.[a-z0-9]+$/i.test(fromName)) return fromName;

  const mime = String(file.mimetype || '').toLowerCase();
  if (mime.includes('png')) return '.png';
  if (mime.includes('webp')) return '.webp';
  if (mime.includes('gif')) return '.gif';
  if (mime.includes('jpeg') || mime.includes('jpg')) return '.jpg';
  return '.jpg';
}

async function moveFileWithFallback(sourcePath: string, destinationPath: string): Promise<void> {
  try {
    await fs.rename(sourcePath, destinationPath);
  } catch {
    await fs.copyFile(sourcePath, destinationPath);
    await fs.unlink(sourcePath).catch(() => undefined);
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const publicAgency = await resolvePublicAgencyFromRequest(req);
    if (!publicAgency) {
      return res.status(404).json({ error: 'Agencia no encontrada' });
    }
    if (isPublicStorefrontBlocked(publicAgency)) {
      return res.status(423).json({
        error: 'El storefront de esta agencia está temporalmente suspendido.',
        code: 'AGENCY_STOREFRONT_BLOCKED',
      });
    }

    const { fields, files } = await parseForm(req);
    const file = (Array.isArray(files.receipt) ? files.receipt[0] : files.receipt) as FormidableFile | undefined;
    const rawTourId = Array.isArray(fields.tourId) ? fields.tourId[0] : fields.tourId;
    const parsedTourId = Number(rawTourId);

    if (!file?.filepath) {
      return res.status(400).json({ error: 'Debes subir una imagen válida del comprobante.' });
    }

    const tour = Number.isFinite(parsedTourId) && parsedTourId > 0
      ? await prisma.tour.findFirst({
          where: { id: parsedTourId, agencyId: publicAgency.id },
          select: {
            agencyId: true,
            agency: {
              select: { slug: true },
            },
          },
        })
      : null;

    if (!tour) {
      return res.status(404).json({ error: 'Tour no encontrado para la agencia pública actual.' });
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'receipts', tour.agency.slug);
    await fs.mkdir(uploadDir, { recursive: true });

    const ext = getSafeExtension(file);
    const name = `receipt-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const destination = path.join(uploadDir, name);
    await moveFileWithFallback(file.filepath, destination);

    const relativePath = path.posix.join('receipts', tour.agency.slug, name);

    await upsertMediaAsset({
      agencyId: tour.agencyId,
      relativePath,
      name,
      extension: ext,
      mimeType: file.mimetype ?? null,
      size: Number.isFinite(Number(file.size)) ? Number(file.size) : null,
    }).catch(() => null);

    return res.status(200).json({ url: `/uploads/${relativePath}` });
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'Error desconocido';
    return res.status(500).json({ error: 'No se pudo subir el comprobante.', detail });
  }
}
