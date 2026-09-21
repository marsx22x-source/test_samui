'use client';

import * as React from 'react';
import { CalendarMonth, CalendarLegend, type CalendarSelection, type DayStatus } from './calendar-month';

/**
 * Интерактивный календарь выбора дат для формы бронирования.
 * Клик 1 — дата заезда, клик 2 — дата выезда. Занятые дни выбрать нельзя.
 * Смена месяцев — направленный слайд (framer-motion).
 */
export function BookingCalendar({
  occupied,
  selection,
  onSelect,
}: {
  occupied: Record<string, DayStatus>;
  selection: CalendarSelection;
  onSelect: (sel: CalendarSelection) => void;
}) {
  const now = new Date();
  const [first, setFirst] = React.useState(() => ({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  }));
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const next = first.month === 11 ? { year: first.year + 1, month: 0 } : { year: first.year, month: first.month + 1 };
  const prevFirst = first.month === 0 ? { year: first.year - 1, month: 11 } : { year: first.year, month: first.month - 1 };
  const todayIso = new Date().toISOString().slice(0, 10);

  const goPrev = () => {
    setDirection(-1);
    setFirst(prevFirst);
  };
  const goNext = () => {
    setDirection(1);
    setFirst(next);
  };

  const handleDay = (iso: string) => {
    if (occupied[iso] || iso < todayIso) return;
    const { from, to } = selection;
    if (!from || (from && to)) {
      onSelect({ from: iso });
      return;
    }
    if (iso <= from) {
      if (occupied[iso]) return;
      onSelect({ from: iso });
      return;
    }
    onSelect({ from, to: iso });
  };

  return (
    <div>
      <div className="grid gap-6 md:grid-cols-2">
        <CalendarMonth
          year={first.year}
          month={first.month}
          occupied={occupied}
          selection={selection}
          onDayClick={handleDay}
          direction={direction}
          onPrev={goPrev}
        />
        <CalendarMonth
          year={next.year}
          month={next.month}
          occupied={occupied}
          selection={selection}
          onDayClick={handleDay}
          direction={direction}
          onNext={goNext}
        />
      </div>
      <div className="mt-3">
        <CalendarLegend />
      </div>
    </div>
  );
}
