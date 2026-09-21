'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { expandRange, isIsoDate, nightsBetween } from '@/lib/dates';

export type ToggleResult = { ok: boolean; blocked?: boolean; error?: string };

/**
 * Переключение дня «Свободно ⇄ Занято» (владелец — только свой объект; админ — любой).
 * Если на дату есть подтверждённая бронь (CalendarDay со ссылкой на Lead) —
 * снять её может только администратор.
 */
export async function toggleDayAction(propertyId: string, isoDate: string): Promise<ToggleResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Требуется авторизация' };
  if (!isIsoDate(isoDate)) return { ok: false, error: 'Некорректная дата' };

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { ok: false, error: 'Объект не найден' };

  if (user.role === 'OWNER' && property.ownerId !== user.id) {
    return { ok: false, error: 'Нет доступа к этому объекту' };
  }

  const date = new Date(`${isoDate}T00:00:00.000Z`);
  const existing = await prisma.calendarDay.findUnique({
    where: { propertyId_date: { propertyId, date } },
  });

  if (existing) {
    if (existing.leadId && user.role !== 'ADMIN') {
      return { ok: false, error: 'День закрыт подтверждённой бронью — обратитесь к администратору' };
    }
    await prisma.calendarDay.delete({ where: { id: existing.id } });
    revalidateCalendar(property.slug);
    return { ok: true, blocked: false };
  }

  try {
    await prisma.calendarDay.create({
      data: { propertyId, date, status: 'BLOCKED' },
    });
  } catch {
    // Гонка двух быстрых кликов: день уже создан — считаем его занятым
    return { ok: true, blocked: true };
  }
  revalidateCalendar(property.slug);
  return { ok: true, blocked: true };
}

/** Принудительное перекрытие диапазона дат (админ; владелец — только свой объект). */
export async function blockRangeAction(
  propertyId: string,
  fromIso: string,
  toIso: string,
): Promise<{ ok: boolean; error?: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: 'Требуется авторизация' };
  if (!isIsoDate(fromIso) || !isIsoDate(toIso) || fromIso >= toIso) {
    return { ok: false, error: 'Проверьте даты диапазона' };
  }
  if (nightsBetween(fromIso, toIso) > 366) {
    return { ok: false, error: 'Максимальная длина диапазона — 366 дней' };
  }

  const property = await prisma.property.findUnique({ where: { id: propertyId } });
  if (!property) return { ok: false, error: 'Объект не найден' };
  if (user.role === 'OWNER' && property.ownerId !== user.id) {
    return { ok: false, error: 'Нет доступа к этому объекту' };
  }

  const days = expandRange(fromIso, toIso);
  await prisma.calendarDay.createMany({
    data: days.map((iso) => ({
      propertyId,
      date: new Date(`${iso}T00:00:00.000Z`),
      status: 'BLOCKED' as const,
    })),
    skipDuplicates: true,
  });

  revalidateCalendar(property.slug);
  return { ok: true };
}

function revalidateCalendar(propertySlug: string) {
  revalidatePath('/');
  revalidatePath(`/property/${propertySlug}`);
  revalidatePath('/admin/calendar');
  revalidatePath('/admin');
  revalidatePath('/owner');
}
