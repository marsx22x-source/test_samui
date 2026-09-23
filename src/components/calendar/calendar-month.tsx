'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { daysInMonthUTC, firstWeekdayUTC, isoFromParts, monthLabel } from '@/lib/dates';
import { monthSlide } from '@/lib/motion';
import { Button } from '@/components/ui/button';

export type DayStatus = 'BOOKED' | 'BLOCKED';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export type CalendarSelection = { from?: string; to?: string };

type Props = {
  year: number;
  month: number; // 0-based
  /** Карта занятости: iso -> статус дня */
  occupied: Record<string, DayStatus>;
  selection?: CalendarSelection;
  onDayClick?: (iso: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  /** Направление последнего перехода: 1 — вперёд, -1 — назад (для слайда) */
  direction?: 1 | -1;
  /** Подсказки при наведении на день: iso -> текст (например, имя гостя брони) */
  dayTitles?: Record<string, string>;
  /** Запретить выбор дат в прошлом */
  disablePast?: boolean;
  /** Подсветить «сегодня» */
  showToday?: boolean;
};

export function CalendarMonth({
  year,
  month,
  occupied,
  selection,
  onDayClick,
  onPrev,
  onNext,
  direction = 1,
  dayTitles,
  disablePast = false,
  showToday = true,
}: Props) {
  const todayIso = new Date().toISOString().slice(0, 10);
  const offset = (firstWeekdayUTC(year, month) + 6) % 7; // неделя с понедельника
  const total = daysInMonthUTC(year, month);
  const cells: Array<string | null> = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: total }, (_, i) => isoFromParts(year, month, i + 1)),
  ];

  return (
    <div className="w-full select-none">
      <div className="mb-2 flex items-center justify-between">
        <Button type="button" variant="ghost" size="icon" onClick={onPrev} disabled={!onPrev} aria-label="Предыдущий месяц" className="transition-transform duration-200 hover:scale-110 active:scale-95">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-sm font-semibold capitalize">
          {monthLabel(year, month)}
        </div>
        <Button type="button" variant="ghost" size="icon" onClick={onNext} disabled={!onNext} aria-label="Следующий месяц" className="transition-transform duration-200 hover:scale-110 active:scale-95">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <div className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false} custom={direction}>
          <motion.div
            key={`${year}-${month}`}
            custom={direction}
            variants={monthSlide}
            initial="enter"
            animate="center"
            exit="exit"
          >
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-xs font-medium text-muted-foreground">
                  {w}
                </div>
              ))}
              <div className="col-span-7 grid grid-cols-7 gap-1">
                {cells.map((iso, i) => {
          if (!iso) return <div key={`empty-${i}`} />;
          const dayNum = Number(iso.slice(8, 10));
          const isToday = showToday && iso === todayIso;
          const isPast = iso < todayIso;
          const occ = occupied[iso];
          const selFrom = selection?.from === iso;
          const selTo = selection?.to === iso;
          const inRange =
            selection?.from && selection?.to && iso > selection.from && iso < selection.to;
          const dayDisabled = !onDayClick || (disablePast && isPast && !occ);

          return (
            <button
              key={iso}
              type="button"
              onClick={onDayClick ? () => onDayClick(iso) : undefined}
              disabled={dayDisabled}
              title={dayTitles?.[iso]}
              className={cn(
                'relative flex h-10 items-center justify-center rounded-md text-sm transition-all duration-150 sm:h-11',
                !occ && !selFrom && !selTo && !inRange && 'hover:scale-[1.08] hover:bg-accent hover:shadow-sm',
                'active:scale-95',
                isPast && !occ && 'text-muted-foreground/50',
                disablePast && isPast && !occ && 'cursor-default opacity-50',
                isToday && 'font-bold ring-1 ring-ring',
                occ === 'BOOKED' && 'bg-rose-500/90 text-white line-through',
                occ === 'BLOCKED' && 'bg-amber-400/90 text-stone-900',
                inRange && !occ && 'bg-accent text-accent-foreground',
                (selFrom || selTo) && 'scale-[1.08] bg-primary font-semibold text-primary-foreground shadow-glow',
                !onDayClick && 'cursor-default hover:scale-100 hover:shadow-none',
              )}
            >
              {dayNum}
            </button>
          );
        })}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <i className="h-3 w-3 rounded bg-rose-500/90" /> занято бронью
      </span>
      <span className="flex items-center gap-1.5">
        <i className="h-3 w-3 rounded bg-amber-400/90" /> перекрыто владельцем
      </span>
      <span className="flex items-center gap-1.5">
        <i className="h-3 w-3 rounded bg-primary" /> ваш выбор
      </span>
    </div>
  );
}
