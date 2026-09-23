'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { isIsoDate } from '@/lib/dates';

export type ReviewFormState = { error?: string; saved?: boolean };

const reviewSchema = z.object({
  propertyId: z.string().min(1),
  authorName: z.string().trim().min(2, 'Укажите имя автора').max(100),
  rating: z.coerce.number().int().min(1, 'Оценка от 1 до 5').max(5),
  text: z.string().trim().min(10, 'Текст отзыва: минимум 10 символов').max(2000),
  stayDate: z
    .string()
    .optional()
    .refine((v) => !v || isIsoDate(v), 'Некорректная дата'),
});

async function revalidate(propertyId: string) {
  await syncPropertyRating(propertyId);
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { slug: true } });
  if (property) {
    revalidatePath('/');
    revalidatePath(`/property/${property.slug}`);
    revalidatePath(`/admin/properties/${propertyId}`);
  }
}

/** Пересчитать денормализованный рейтинг объекта по его отзывам. */
async function syncPropertyRating(propertyId: string): Promise<void> {
  const agg = await prisma.review.aggregate({
    where: { propertyId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      ratingAvg: agg._avg.rating ?? null,
      ratingCount: agg._count._all,
    },
  });
}

/** Добавить отзыв (только админ — ручная модерация). */
export async function createReviewAction(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  await requireRole(['ADMIN']);

  const parsed = reviewSchema.safeParse({
    propertyId: formData.get('propertyId'),
    authorName: formData.get('authorName'),
    rating: formData.get('rating'),
    text: formData.get('text'),
    stayDate: String(formData.get('stayDate') || '').trim() || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Проверьте поля' };
  const d = parsed.data;

  const property = await prisma.property.findUnique({ where: { id: d.propertyId }, select: { id: true } });
  if (!property) return { error: 'Объект не найден' };

  try {
    await prisma.review.create({
      data: {
        propertyId: d.propertyId,
        authorName: d.authorName,
        rating: d.rating,
        text: d.text,
        stayDate: d.stayDate ? new Date(`${d.stayDate}T00:00:00.000Z`) : null,
      },
    });
  } catch (e) {
    console.error('[createReview] error:', e);
    return { error: 'Не удалось сохранить отзыв' };
  }

  await revalidate(d.propertyId);
  return { saved: true };
}

export async function deleteReviewAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);

  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) return { ok: false, error: 'Отзыв не найден' };

  try {
    await prisma.review.delete({ where: { id } });
  } catch (e) {
    console.error('[deleteReview] error:', e);
    return { ok: false, error: 'Не удалось удалить отзыв' };
  }

  await revalidate(review.propertyId);
  return { ok: true };
}
