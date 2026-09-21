'use server';

import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/auth';

export type OwnerFormState = { error?: string; saved?: boolean };

const ownerSchema = z.object({
  name: z.string().trim().min(2, 'Имя: минимум 2 символа').max(100),
  email: z.string().trim().toLowerCase().email('Некорректный email'),
  password: z.string().min(8, 'Пароль: минимум 8 символов').max(100).optional(),
  telegramChatId: z
    .string()
    .trim()
    .refine((v) => v === '' || /^-?\d{5,}$/.test(v), 'Chat ID: только цифры')
    .optional(),
  whatsappPhone: z
    .string()
    .trim()
    .refine((v) => v === '' || v.replace(/\D/g, '').length >= 10, 'Телефон: минимум 10 цифр')
    .optional(),
});

function parseOwnerForm(formData: FormData) {
  return ownerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password') || undefined,
    telegramChatId: String(formData.get('telegramChatId') || '').trim(),
    whatsappPhone: String(formData.get('whatsappPhone') || '').trim(),
  });
}

export async function createOwnerAction(
  _prev: OwnerFormState,
  formData: FormData,
): Promise<OwnerFormState> {
  await requireRole(['ADMIN']);

  const parsed = parseOwnerForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;
  if (!d.password) return { error: 'Задайте пароль (минимум 8 символов)' };

  const exists = await prisma.user.findUnique({ where: { email: d.email } });
  if (exists) return { error: 'Пользователь с таким email уже существует' };

  try {
    await prisma.user.create({
      data: {
        name: d.name,
        email: d.email,
        passwordHash: await bcrypt.hash(d.password, 10),
        role: 'OWNER',
        telegramChatId: d.telegramChatId || null,
        whatsappPhone: d.whatsappPhone || null,
      },
    });
  } catch (e) {
    console.error('[createOwner] error:', e);
    return { error: 'Не удалось создать владельца (возможно, email уже занят)' };
  }

  revalidatePath('/admin/owners');
  return { saved: true };
}

export async function updateOwnerAction(
  id: string,
  _prev: OwnerFormState,
  formData: FormData,
): Promise<OwnerFormState> {
  await requireRole(['ADMIN']);

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { error: 'Пользователь не найден' };

  const parsed = parseOwnerForm(formData);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const d = parsed.data;

  const emailTaken = await prisma.user.findUnique({ where: { email: d.email } });
  if (emailTaken && emailTaken.id !== id) return { error: 'Email занят другим пользователем' };

  try {
    await prisma.user.update({
      where: { id },
      data: {
        name: d.name,
        email: d.email,
        ...(d.password ? { passwordHash: await bcrypt.hash(d.password, 10) } : {}),
        telegramChatId: d.telegramChatId || null,
        whatsappPhone: d.whatsappPhone || null,
      },
    });
  } catch (e) {
    console.error('[updateOwner] error:', e);
    return { error: 'Не удалось обновить владельца' };
  }

  revalidatePath('/admin/owners');
  return { saved: true };
}

/** Удаление владельца запрещено, если за ним закреплены объекты. */
export async function deleteOwnerAction(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireRole(['ADMIN']);

  const target = await prisma.user.findUnique({ where: { id }, include: { _count: { select: { properties: true } } } });
  if (!target) return { ok: false, error: 'Пользователь не найден' };
  if (target.role === 'ADMIN') return { ok: false, error: 'Нельзя удалить администратора' };
  if (target._count.properties > 0) {
    return { ok: false, error: `За владельцем закреплено объектов: ${target._count.properties}. Сначала переназначьте их.` };
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (e) {
    console.error('[deleteOwner] error:', e);
    return { ok: false, error: 'Не удалось удалить пользователя' };
  }
  revalidatePath('/admin/owners');
  return { ok: true };
}
