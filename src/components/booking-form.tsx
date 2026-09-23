'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, CheckCircle2, Send } from 'lucide-react';
import { createLeadAction, type LeadFormState } from '@/actions/leads';
import { BookingCalendar } from '@/components/calendar/booking-calendar';
import { PhoneInput } from '@/components/phone-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { MESSENGERS } from '@/lib/constants';
import { formatRuDate, nightsBetween } from '@/lib/dates';
import { popIn } from '@/lib/motion';
import { formatPrice } from '@/lib/utils';
import type { DayStatus } from '@/components/calendar/calendar-month';

const initial: LeadFormState = { status: 'idle' };

export function BookingForm({
  propertyId,
  occupied,
  maxGuests,
  pricePerNight,
  minNights = 1,
  deposit,
  checkInTime,
  checkOutTime,
}: {
  propertyId: string;
  occupied: Record<string, DayStatus>;
  maxGuests: number;
  pricePerNight: number;
  minNights?: number;
  deposit?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
}) {
  const [state, formAction] = useFormState(createLeadAction, initial);
  const [selection, setSelection] = React.useState<{ from?: string; to?: string }>({});

  const nights = selection.from && selection.to ? nightsBetween(selection.from, selection.to) : 0;
  const tooShort = nights > 0 && nights < minNights;
  const total = nights > 0 ? nights * pricePerNight : 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {state.status === 'success' ? (
        <motion.div
          key="success"
          variants={popIn}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center"
        >
          <CheckCircle2 className="h-12 w-12 text-emerald-600" />
          <p className="font-semibold text-emerald-800">Заявка отправлена!</p>
          <p className="text-sm text-emerald-700">{state.message}</p>
        </motion.div>
      ) : (
        <motion.form
          key="form"
          action={formAction}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -10, transition: { duration: 0.15 } }}
          className="space-y-4"
        >
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="dateFrom" value={selection.from ?? ''} readOnly />
          <input type="hidden" name="dateTo" value={selection.to ?? ''} readOnly />

          <div className="rounded-xl border bg-card p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="h-4 w-4 text-primary" />
              Выберите даты
              {nights > 0 && <span className="text-muted-foreground">· {nights} ноч.</span>}
            </p>
            <BookingCalendar occupied={occupied} selection={selection} onSelect={setSelection} />
            <p
              key={`${selection.from ?? ''}|${selection.to ?? ''}`}
              className="mt-3 animate-fade-in rounded-md bg-secondary px-3 py-2 text-sm"
            >
              {selection.from
                ? `Заезд: ${formatRuDate(selection.from)}${selection.to ? ` — выезд: ${formatRuDate(selection.to)}` : ' — выберите дату выезда'}`
                : 'Нажмите на свободную дату заезда'}
            </p>

            {/* Итоговая стоимость */}
            {nights > 0 && !tooShort && (
              <div key={total} className="mt-2 animate-fade-in rounded-md border border-primary/20 bg-primary/5 px-3 py-2.5 text-sm">
                <p className="flex items-baseline justify-between">
                  <span className="text-muted-foreground">
                    {formatPrice(pricePerNight)} ₽ × {nights} ноч.
                  </span>
                  <span className="text-base font-bold text-primary">{formatPrice(total)} ₽</span>
                </p>
                {deposit ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    + залог {formatPrice(deposit)} ₽ при заезде (возвращается при выезде)
                  </p>
                ) : null}
                {(checkInTime || checkOutTime) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {checkInTime ? `Заезд с ${checkInTime}` : ''}
                    {checkInTime && checkOutTime ? ' · ' : ''}
                    {checkOutTime ? `выезд до ${checkOutTime}` : ''}
                  </p>
                )}
              </div>
            )}
            {tooShort && (
              <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Минимальный срок проживания — {minNights} ноч. Выберите более длинный период.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="guestName">Ваше имя *</Label>
              <Input id="guestName" name="guestName" required minLength={2} placeholder="Иван" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guestPhone">Телефон *</Label>
              <PhoneInput id="guestPhone" name="guestPhone" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="messenger">Мессенджер</Label>
              <Select id="messenger" name="messenger" defaultValue="Telegram">
                {MESSENGERS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guests">Гостей</Label>
              <Select id="guests" name="guests" defaultValue="2">
                {Array.from({ length: maxGuests }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comment">Комментарий</Label>
            <Textarea id="comment" name="comment" rows={3} placeholder="Пожелания, вопросы…" />
          </div>

          {state.status === 'error' && state.message && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{state.message}</p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={!selection.from || !selection.to || tooShort}>
            <Send className="h-4 w-4" /> Отправить заявку
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Отправляя заявку, вы соглашаетесь на обработку персональных данных
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  );
}
