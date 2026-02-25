import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdir } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_ROOT = resolve(__dirname, '../../../../uploads');

export function getUploadsRoot(): string {
  return UPLOADS_ROOT;
}

export async function ensurePropertyDir(propertyId: number): Promise<string> {
  const dir = resolve(UPLOADS_ROOT, String(propertyId));
  await mkdir(dir, { recursive: true });
  return dir;
}

export function getStoragePath(propertyId: number, filename: string): string {
  return `${propertyId}/${filename}`;
}

export function getAbsolutePath(storagePath: string): string {
  return resolve(UPLOADS_ROOT, storagePath);
}
