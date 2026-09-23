'use server';

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notifyNewLead } from '@/services/notifications';
import { isIsoDate, nightsBetween } from '@/lib/dates';

export type LeadFormState = { status: 'idle' | 'success' | 'error'; message?: string };

const leadSchema = z
  .object({
    propertyId: z.string().min(1),
    guestName: z.string().trim().min(2, 'Укажите имя').max(100),
    guestPhone: z
      .string()
      .trim()
      .transform((v) => v.replace(/[^\d+]/g, ''))
      .pipe(z.string().min(10, 'Укажите телефон полностью').max(20)),
    messenger: z.string().max(30).optional(),
    dateFrom: z.string().refine(isIsoDate, 'Некорректная дата заезда'),
    dateTo: z.string().refine(isIsoDate, 'Некорректная дата выезда'),
    guests: z.coerce.number().int().min(1, 'Минимум 1 гость').max(30),
    comment: z.string().trim().max(2000).optional(),
  })
  .refine((v) => v.dateFrom < v.dateTo, { message: 'Дата выезда должна быть позже заезда', path: ['dateTo'] })
  .refine((v) => nightsBetween(v.dateFrom, v.dateTo) <= 60, {
    message: 'Максимальный диапазон — 60 ночей',
    path: ['dateTo'],
  });

/**
 * Создание заявки гостем с публичного сайта.
 * Заявка сохраняется в CRM, после чего (не блокируя ответ при сбоях каналов)
 * рассылаются уведомления админам и владельцу объекта.
 */
export async function createLeadAction(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const parsed = leadSchema.safeParse({
    propertyId: formData.get('propertyId'),
    guestName: formData.get('guestName'),
    guestPhone: formData.get('guestPhone'),
    messenger: formData.get('messenger') || undefined,
    dateFrom: formData.get('dateFrom'),
    dateTo: formData.get('dateTo'),
    guests: formData.get('guests') ?? 1,
    comment: formData.get('comment') || undefined,
  });

  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Проверьте поля формы' };
  }
  const data = parsed.data;

  const property = await prisma.property.findUnique({
    where: { id: data.propertyId },
  });
  if (!property || !property.isPublished) {
    return { status: 'error', message: 'Объект не найден или недоступен для бронирования' };
  }

  const nights = nightsBetween(data.dateFrom, data.dateTo);
  if (nights < property.minNights) {
    return { status: 'error', message: `Минимальный срок проживания — ${property.minNights} ноч.` };
  }

  const lead = await prisma.lead.create({
    data: {
      propertyId: property.id,
      guestName: data.guestName,
      guestPhone: data.guestPhone,
      messenger: data.messenger || null,
      dateFrom: new Date(`${data.dateFrom}T00:00:00.000Z`),
      dateTo: new Date(`${data.dateTo}T00:00:00.000Z`),
      guests: data.guests,
      comment: data.comment || null,
    },
  });

  // Уведомления не должны ломать создание заявки: ловим всё.
  await notifyNewLead({
    id: lead.id,
    guestName: lead.guestName,
    guestPhone: lead.guestPhone,
    messenger: lead.messenger,
    dateFrom: lead.dateFrom,
    dateTo: lead.dateTo,
    guests: lead.guests,
    comment: lead.comment,
    property: {
      id: property.id,
      title: property.title,
      slug: property.slug,
    },
  }).catch((e) => console.error('[createLead] notify error:', e));

  return {
    status: 'success',
    message: `Заявка отправлена! Мы свяжемся с вами по указанному телефону.`,
  };
}
