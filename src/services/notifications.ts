/**
 * Сервисный слой уведомлений о новых заявках.
 *
 * Каналы:
 *  - Telegram Bot API         (TG_BOT_TOKEN)
 *  - WhatsApp Green-API/Meta  (WHATSAPP_PROVIDER = green-api | meta)
 *  - Email через SMTP         (nodemailer)
 *
 * Все отправки «best effort»: ошибка одного канала не ломает создание заявки.
 * Каждый канал пропускается (с пометкой в логе), если не настроены его креды.
 */
import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';
import { formatPhone } from '@/lib/utils';
import { formatRuDate, nightsBetween, toISODate } from '@/lib/dates';

const APP_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const FETCH_TIMEOUT_MS = 10_000;

export type NewLeadPayload = {
  id: string;
  guestName: string;
  guestPhone: string;
  messenger?: string | null;
  dateFrom: Date;
  dateTo: Date;
  guests: number;
  comment?: string | null;
  property: {
    id: string;
    title: string;
    slug: string;
  };
};

function buildText(lead: NewLeadPayload): string {
  const from = toISODate(lead.dateFrom);
  const to = toISODate(lead.dateTo);
  const lines = [
    '🔔 Новая заявка с сайта',
    '',
    `🏠 Объект: ${lead.property.title}`,
    `👤 Гость: ${lead.guestName}`,
    `📞 Телефон: ${formatPhone(lead.guestPhone)}`,
    lead.messenger ? `💬 Мессенджер: ${lead.messenger}` : null,
    `📅 Даты: ${formatRuDate(from)} — ${formatRuDate(to)} (${nightsBetween(from, to)} ноч.)`,
    `👨‍👩‍👧 Гостей: ${lead.guests}`,
    lead.comment ? `📝 Комментарий: ${lead.comment}` : null,
    '',
    `Открыть в CRM: ${APP_URL}/admin/leads`,
  ];
  return lines.filter((l): l is string => l !== null).join('\n');
}

// ---------------------------------------------------------------- Telegram

export async function sendTelegram(chatId: string, text: string): Promise<void> {
  const token = process.env.TG_BOT_TOKEN;
  if (!token || !chatId) {
    console.log('[notify:telegram] пропущено (нет TG_BOT_TOKEN или chat_id)');
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      // Без parse_mode: текст содержит пользовательский ввод (имя, комментарий),
      // и HTML-режим ломался бы на неэкранированных символах < > &.
      // URL в plain text Telegram кликабеляет автоматически.
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Telegram API ${res.status}: ${body.slice(0, 300)}`);
  }
}

// ---------------------------------------------------------------- WhatsApp

function waPhoneToChatId(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `${digits}@c.us`;
}

export async function sendWhatsApp(phone: string, text: string): Promise<void> {
  if (!phone) {
    console.log('[notify:whatsapp] пропущено (не указан телефон получателя)');
    return;
  }
  const provider = (process.env.WHATSAPP_PROVIDER || '').toLowerCase();

  if (provider === 'green-api') {
    const instance = process.env.WHATSAPP_GREEN_API_INSTANCE_ID;
    const token = process.env.WHATSAPP_GREEN_API_TOKEN;
    if (!instance || !token) {
      console.log('[notify:whatsapp] пропущено (нет Green-API кредов)');
      return;
    }
    const res = await fetch(
      `https://api.green-api.com/waInstance${instance}/sendMessage/${token}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId: waPhoneToChatId(phone), message: text }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Green-API ${res.status}: ${body.slice(0, 300)}`);
    }
    return;
  }

  if (provider === 'meta') {
    const phoneNumberId = process.env.WHATSAPP_META_PHONE_NUMBER_ID;
    const token = process.env.WHATSAPP_META_TOKEN;
    if (!phoneNumberId || !token) {
      console.log('[notify:whatsapp] пропущено (нет Meta Cloud API кредов)');
      return;
    }
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/\D/g, ''),
          type: 'text',
          text: { body: text },
        }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Meta WhatsApp API ${res.status}: ${body.slice(0, 300)}`);
    }
    return;
  }

  console.log('[notify:whatsapp] пропущено (WHATSAPP_PROVIDER не настроен)');
}

// ---------------------------------------------------------------- Email

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendEmail(to: string, subject: string, text: string): Promise<void> {
  const transport = getTransport();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  if (!transport || !to || !from) {
    console.log('[notify:email] пропущено (не настроен SMTP или получатель)');
    return;
  }
  await transport.sendMail({ from, to, subject, text });
}

// ---------------------------------------------------- Рассылка по новой заявке

export async function notifyNewLead(lead: NewLeadPayload): Promise<void> {
  // Заявки видит и обрабатывает только администратор (владелец управляет календарём)
  const text = buildText(lead);

  // Получатели-админы: env-чат + все пользователи с ролью ADMIN
  let adminChatIds: string[] = [];
  let adminEmails: string[] = [];
  try {
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { telegramChatId: true, email: true },
    });
    adminChatIds = admins.map((a) => a.telegramChatId).filter((v): v is string => Boolean(v));
    adminEmails = admins.map((a) => a.email);
  } catch (e) {
    console.error('[notify] не удалось получить список админов:', e);
  }

  if (process.env.TG_ADMIN_CHAT_ID) {
    adminChatIds = [process.env.TG_ADMIN_CHAT_ID, ...adminChatIds];
  }
  if (process.env.SMTP_ADMIN_EMAIL) {
    adminEmails = [process.env.SMTP_ADMIN_EMAIL, ...adminEmails];
  }
  const adminWaPhone = process.env.WHATSAPP_ADMIN_PHONE || '';

  const jobs: Array<{ channel: string; run: () => Promise<void> }> = [];

  // --- уведомления администраторам
  for (const chatId of new Set(adminChatIds)) {
    jobs.push({ channel: `telegram:${chatId}`, run: () => sendTelegram(chatId, text) });
  }
  if (adminWaPhone) {
    jobs.push({ channel: 'whatsapp:admins', run: () => sendWhatsApp(adminWaPhone, text) });
  }
  for (const email of new Set(adminEmails)) {
    jobs.push({
      channel: `email:${email}`,
      run: () => sendEmail(email, `Новая заявка — ${lead.property.title}`, text),
    });
  }

  const results = await Promise.allSettled(jobs.map((j) => j.run()));
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      console.error(`[notify] ошибка канала ${jobs[i].channel}:`, r.reason);
    }
  });
}
