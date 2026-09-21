// Все даты календаря передаются как строки 'yyyy-MM-dd' (UTC-пinned),
// чтобы не зависеть от часового пояса сервера/клиента.

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function isoToDate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

/** Все дни диапазона [fromIso, toIso] включительно. */
export function expandRange(fromIso: string, toIso: string): string[] {
  const out: string[] = [];
  let cur = isoToDate(fromIso).getTime();
  const end = isoToDate(toIso).getTime();
  while (cur <= end) {
    out.push(new Date(cur).toISOString().slice(0, 10));
    cur += 86_400_000;
  }
  return out;
}

export function nightsBetween(fromIso: string, toIso: string): number {
  return Math.round((isoToDate(toIso).getTime() - isoToDate(fromIso).getTime()) / 86_400_000);
}

export function isIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(isoToDate(value).getTime());
}

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function monthLabel(year: number, monthIndex: number): string {
  return `${MONTHS_RU[monthIndex]} ${year}`;
}

export function formatRuDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? isoToDate(iso) : iso;
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
}

export function daysInMonthUTC(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

export function firstWeekdayUTC(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex, 1)).getUTCDay(); // 0 = воскресенье
}

export function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

export function isoFromParts(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
}
