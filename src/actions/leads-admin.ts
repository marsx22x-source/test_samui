'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';
import { expandRange, toISODate } from '@/lib/dates';
import { LEAD_STATUSES, type LeadStatusValue } from '@/lib/constants';

/**
 * Смена статуса заявки (только админ).
 * При переводе в CONFIRMED — даты брони автоматически закрываются в календаре,
 * при уходе с CONFIRMED — снятие именно этих дней брони.
 */
export async function updateLeadStatusAction(leadId: string, status: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);

  if (!LEAD_STATUSES.includes(status as LeadStatusValue)) {
    return { ok: false, error: 'Некорректный статус' };
  }
  const nextStatus = status as LeadStatusValue;

  const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { property: true } });
  if (!lead) return { ok: false, error: 'Заявка не найдена' };

  try {
    await prisma.$transaction(async (tx) => {
      // Если заявка была подтверждена, а теперь нет — снимаем её дни из календаря
      if (lead.status === 'CONFIRMED' && nextStatus !== 'CONFIRMED') {
        await tx.calendarDay.deleteMany({ where: { leadId: lead.id } });
      }

      await tx.lead.update({ where: { id: lead.id }, data: { status: nextStatus } });

      if (nextStatus === 'CONFIRMED') {
        const days = expandRange(toISODate(lead.dateFrom), toISODate(lead.dateTo));
        // upsert: перезакрываем день бронью (даже если был BLOCKED вручную)
        for (const iso of days) {
          const date = new Date(`${iso}T00:00:00.000Z`);
          await tx.calendarDay.upsert({
            where: { propertyId_date: { propertyId: lead.propertyId, date } },
            update: { status: 'BOOKED', leadId: lead.id },
            create: { propertyId: lead.propertyId, date, status: 'BOOKED', leadId: lead.id },
          });
        }
      }
    });
  } catch (e) {
    console.error('[updateLeadStatus] error:', e);
    return { ok: false, error: 'Не удалось изменить статус, попробуйте ещё раз' };
  }

  revalidatePath('/admin/leads');
  revalidatePath('/admin');
  revalidatePath('/admin/calendar');
  revalidatePath('/owner');
  revalidatePath(`/property/${lead.property.slug}`);
  return { ok: true };
}

/** Удаление заявки (админ). Её дни в календаре освобождаются. */
export async function deleteLeadAction(leadId: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);
  const lead = await prisma.lead.findUnique({ where: { id: leadId } });
  if (!lead) return { ok: false, error: 'Заявка не найдена' };

  try {
    // Сначала снимаем дни, закрытые этой бронью (иначе они останутся занятыми навсегда)
    await prisma.calendarDay.deleteMany({ where: { leadId } });
    await prisma.lead.delete({ where: { id: leadId } });
  } catch (e) {
    console.error('[deleteLead] error:', e);
    return { ok: false, error: 'Не удалось удалить заявку' };
  }

  revalidatePath('/admin/leads');
  revalidatePath('/admin');
  revalidatePath('/owner');
  return { ok: true };
}
