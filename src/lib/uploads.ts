import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import path from 'path';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/gif': 'gif',
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB

/** Множество допустимых MIME-типов (для предварительной валидации без записи на диск). */
export const ALLOWED_IMAGE_TYPES = new Set(Object.keys(ALLOWED_MIME));

export const CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  gif: 'image/gif',
};

/**
 * Сохраняет файл изображения в UPLOAD_DIR и возвращает публичный URL.
 * Бросает исключение при недопустимом типе/размере.
 */
export async function saveImageFile(file: File): Promise<string> {
  const ext = ALLOWED_MIME[file.type];
  if (!ext) throw new Error(`Недопустимый тип файла: ${file.type || 'неизвестен'}`);
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Файл больше 8 МБ');

  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOAD_DIR, name), bytes);
  return `/api/files/${name}`;
}

/** Удаляет файл загрузки по URL вида /api/files/<name> (safe: только имя файла). */
export async function deleteImageFile(url: string): Promise<void> {
  const name = url.split('/').pop();
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) return;
  const { unlink } = await import('fs/promises');
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => undefined);
}
