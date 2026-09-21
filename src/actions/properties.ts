'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { AMENITIES } from '@/lib/constants';
import { slugify } from '@/lib/utils';
import { saveImageFile, deleteImageFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '@/lib/uploads';

export type PropertyFormState = { error?: string; saved?: boolean };

const propertySchema = z.object({
  title: z.string().trim().min(3, 'Название: минимум 3 символа').max(150),
  description: z.string().trim().min(10, 'Описание: минимум 10 символов').max(5000),
  propertyType: z.string().min(2).max(50),
  pricePerNight: z.coerce.number().int().min(100, 'Минимальная цена — 100 ₽').max(10_000_000),
  location: z.string().trim().min(2, 'Укажите локацию').max(100),
  address: z.string().trim().min(2, 'Укажите адрес').max(300),
  maxGuests: z.coerce.number().int().min(1).max(50),
  bedrooms: z.coerce.number().int().min(0).max(30),
  area: z.coerce.number().int().min(0).max(10000).optional(),
  isPublished: z.boolean(),
});

function parseForm(formData: FormData) {
  const amenities = formData.getAll('amenities').map(String).filter((a) => (AMENITIES as readonly string[]).includes(a));
  const parsed = propertySchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    propertyType: formData.get('propertyType'),
    pricePerNight: formData.get('pricePerNight'),
    location: formData.get('location'),
    address: formData.get('address'),
    maxGuests: formData.get('maxGuests'),
    bedrooms: formData.get('bedrooms'),
    area: formData.get('area') || undefined,
    isPublished: formData.get('isPublished') === 'on',
  });
  return { parsed, amenities };
}

async function uniqueSlug(title: string, excludeId?: string): Promise<string> {
  const base = slugify(title);
  let slug = base;
  let i = 1;
  for (;;) {
    const existing = await prisma.property.findUnique({ where: { slug }, select: { id: true } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${++i}`;
  }
}

export async function createPropertyAction(
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  await requireRole(['ADMIN']);

  const ownerId = String(formData.get('ownerId') || '');
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) return { error: 'Выберите владельца объекта' };

  const { parsed, amenities } = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const slug = await uniqueSlug(d.title);
  const property = await prisma.property.create({
    data: {
      title: d.title,
      slug,
      description: d.description,
      propertyType: d.propertyType,
      pricePerNight: d.pricePerNight,
      location: d.location,
      address: d.address,
      maxGuests: d.maxGuests,
      bedrooms: d.bedrooms,
      area: d.area || null,
      amenities,
      isPublished: d.isPublished,
      ownerId,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin/properties');
  redirect(`/admin/properties/${property.id}`);
}

export async function updatePropertyAction(
  id: string,
  _prev: PropertyFormState,
  formData: FormData,
): Promise<PropertyFormState> {
  await requireRole(['ADMIN']);

  const existing = await prisma.property.findUnique({ where: { id } });
  if (!existing) return { error: 'Объект не найден' };

  const ownerId = String(formData.get('ownerId') || '');
  const owner = await prisma.user.findUnique({ where: { id: ownerId } });
  if (!owner) return { error: 'Выберите владельца объекта' };

  const { parsed, amenities } = parseForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const slug = d.title !== existing.title ? await uniqueSlug(d.title, id) : existing.slug;

  await prisma.property.update({
    where: { id },
    data: {
      title: d.title,
      slug,
      description: d.description,
      propertyType: d.propertyType,
      pricePerNight: d.pricePerNight,
      location: d.location,
      address: d.address,
      maxGuests: d.maxGuests,
      bedrooms: d.bedrooms,
      area: d.area || null,
      amenities,
      isPublished: d.isPublished,
      ownerId,
    },
  });

  revalidatePath('/');
  revalidatePath('/admin/properties');
  revalidatePath(`/property/${slug}`);
  revalidatePath(`/admin/properties/${id}`);
  return { saved: true };
}

export async function togglePublishAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);
  const property = await prisma.property.findUnique({ where: { id }, select: { isPublished: true, slug: true } });
  if (!property) return { ok: false, error: 'Объект не найден' };
  await prisma.property.update({ where: { id }, data: { isPublished: !property.isPublished } });
  revalidatePath('/');
  revalidatePath('/admin/properties');
  revalidatePath(`/property/${property.slug}`);
  return { ok: true };
}

export async function deletePropertyAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);
  const property = await prisma.property.findUnique({ where: { id }, include: { images: true } });
  if (!property) return { ok: false, error: 'Объект не найден' };

  try {
    await prisma.property.delete({ where: { id } });
  } catch (e) {
    console.error('[deleteProperty] error:', e);
    return { ok: false, error: 'Не удалось удалить объект' };
  }
  await Promise.all(property.images.map((img) => deleteImageFile(img.url)));

  revalidatePath('/');
  revalidatePath('/admin/properties');
  return { ok: true };
}

// ------------------------------------------------------------------ изображения

export async function uploadImagesAction(
  propertyId: string,
  _prev: { error?: string },
  formData: FormData,
): Promise<{ error?: string }> {
  await requireRole(['ADMIN']);

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { error: 'Объект не найден' };

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: 'Выберите хотя бы один файл' };

  // Сначала валидируем ВСЁ, потом пишем на диск — иначе при ошибке в середине
  // останутся «осиротевшие» файлы.
  const picked = files.slice(0, 15);
  for (const file of picked) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return { error: `Недопустимый тип файла «${file.name || file.type}» (нужен jpg/png/webp/avif/gif)` };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: `Файл «${file.name}» больше 8 МБ` };
    }
  }

  const count = await prisma.propertyImage.count({ where: { propertyId } });
  const rows: Array<{ url: string; sortOrder: number; propertyId: string }> = [];
  try {
    for (const file of picked) {
      const url = await saveImageFile(file);
      rows.push({ url, sortOrder: count + rows.length, propertyId });
    }
    await prisma.propertyImage.createMany({ data: rows });
  } catch (e) {
    // Чистим за собой при сбое записи
    await Promise.all(rows.map((r) => deleteImageFile(r.url)));
    return { error: e instanceof Error ? e.message : 'Не удалось сохранить файлы' };
  }

  revalidatePath(`/admin/properties/${propertyId}`);
  revalidatePath(`/property/${property.slug}`);
  revalidatePath('/');
  return {};
}

export async function deleteImageAction(imageId: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);
  const image = await prisma.propertyImage.findUnique({ where: { id: imageId }, include: { property: true } });
  if (!image) return { ok: false, error: 'Изображение не найдено' };

  await prisma.propertyImage.delete({ where: { id: imageId } });
  await deleteImageFile(image.url);

  revalidatePath(`/admin/properties/${image.propertyId}`);
  revalidatePath(`/property/${image.property.slug}`);
  revalidatePath('/');
  return { ok: true };
}

export async function setCoverImageAction(imageId: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);
  const image = await prisma.propertyImage.findUnique({ where: { id: imageId }, include: { property: true } });
  if (!image) return { ok: false, error: 'Изображение не найдено' };

  const minOrder = await prisma.propertyImage.findFirst({
    where: { propertyId: image.propertyId },
    orderBy: { sortOrder: 'asc' },
    select: { sortOrder: true },
  });
  await prisma.propertyImage.update({
    where: { id: imageId },
    data: { sortOrder: (minOrder?.sortOrder ?? 0) - 1 },
  });

  revalidatePath(`/admin/properties/${image.propertyId}`);
  revalidatePath(`/property/${image.property.slug}`);
  revalidatePath('/');
  return { ok: true };
}
