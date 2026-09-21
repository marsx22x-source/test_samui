'use client';

import * as React from 'react';
import { toggleDayAction } from '@/actions/calendar';
import { CalendarMonth, type DayStatus } from './calendar-month';

/**
 * Календарь владельца/админа: тап по дню переключает «Свободно ⇄ Занято».
 * Оптимистичное обновление + мгновенная синхронизация с публичным сайтом
 * (серверный экшен ревалидирует страницы витрины).
 * Прошедшие дни переключать нельзя.
 */
export function ToggleCalendar({
  propertyId,
  initialOccupied,
}: {
  propertyId: string;
  initialOccupied: Record<string, DayStatus>;
}) {
  const [occupied, setOccupied] = React.useState(initialOccupied);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const now = new Date();
  const [view, setView] = React.useState(() => ({
    year: now.getUTCFullYear(),
    month: now.getUTCMonth(),
  }));
  const [direction, setDirection] = React.useState<1 | -1>(1);

  const prev =
    view.month === 0 ? { year: view.year - 1, month: 11 } : { year: view.year, month: view.month - 1 };
  const next =
    view.month === 11 ? { year: view.year + 1, month: 0 } : { year: view.year, month: view.month + 1 };

  const goPrev = () => {
    setDirection(-1);
    setView(prev);
  };
  const goNext = () => {
    setDirection(1);
    setView(next);
  };

  /** Возврат дня к серверному состоянию (по данным на момент монтирования). */
  const rollbackDay = (iso: string) => {
    setOccupied((prevMap) => {
      const copy = { ...prevMap };
      if (initialOccupied[iso]) copy[iso] = initialOccupied[iso];
      else delete copy[iso];
      return copy;
    });
  };

  const handleDay = (iso: string) => {
    setError(null);
    const wasOccupied = Boolean(occupied[iso]);
    // Оптимистично переключаем
    setOccupied((prevMap) => {
      const copy = { ...prevMap };
      if (wasOccupied) delete copy[iso];
      else copy[iso] = 'BLOCKED' as DayStatus;
      return copy;
    });

    startTransition(async () => {
      try {
        const res = await toggleDayAction(propertyId, iso);
        if (!res.ok) {
          rollbackDay(iso);
          setError(res.error ?? 'Не удалось обновить дату');
        }
      } catch {
        rollbackDay(iso);
        setError('Ошибка сети — не удалось обновить дату');
      }
    });
  };

  return (
    <div>
      <div className="mx-auto max-w-md">
        <CalendarMonth
          year={view.year}
          month={view.month}
          occupied={occupied}
          onDayClick={handleDay}
          direction={direction}
          disablePast
          onPrev={goPrev}
          onNext={goNext}
        />
      </div>
      {error && <p className="mt-3 text-center text-sm font-medium text-destructive">{error}</p>}
      {pending && <p className="mt-2 text-center text-xs text-muted-foreground">Сохранение…</p>}
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Нажмите на дату, чтобы переключить «Свободно / Занято». Изменения сразу видны на сайте.
      </p>
    </div>
  );
}
