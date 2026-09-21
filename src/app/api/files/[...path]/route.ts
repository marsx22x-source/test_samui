import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';
import { UPLOAD_DIR, CONTENT_TYPES } from '@/lib/uploads';

/**
 * Раздача загруженных изображений из UPLOAD_DIR (том Docker).
 * Имя файла жёстко валидируется — path traversal исключён.
 */
export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const name = params.path?.[0] ?? '';
  if (!name || name.includes('..') || name.includes('/') || name.includes('\\')) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const contentType = CONTENT_TYPES[ext];
  if (!contentType) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    const file = await readFile(path.join(UPLOAD_DIR, name));
    return new Response(new Uint8Array(file), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
}
