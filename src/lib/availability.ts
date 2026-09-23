/**
 * Расчёт доступности объекта по множеству занятых ISO-дат.
 * Используется для индикаторов на карточках каталога и странице объекта.
 */

export const AVAILABILITY_HORIZON_DAYS = 30;

export type CardAvailability = {
  /** Свободна ли уже сегодня */
  isFree: boolean;
  /** Сколько дней подряд свободна, начиная с freeFromIso (в пределах горизонта) */
  freeDays: number;
  /** Ближайшая свободная дата (ISO) */
  freeFromIso: string;
};

const DAY_MS = 86_400_000;

function isoFromUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function computeAvailability(
  busyIsoSet: Set<string>,
  horizonDays = AVAILABILITY_HORIZON_DAYS,
): CardAvailability {
  const today = Date.parse(new Date().toISOString().slice(0, 10) + 'T00:00:00.000Z');

  // Ближайшая свободная дата
  let firstFree = -1;
  for (let i = 0; i < horizonDays; i++) {
    if (!busyIsoSet.has(isoFromUtc(today + i * DAY_MS))) {
      firstFree = i;
      break;
    }
  }

  // Весь горизонт занят
  if (firstFree === -1) {
    return { isFree: false, freeDays: 0, freeFromIso: isoFromUtc(today + horizonDays * DAY_MS) };
  }

  // Длина свободного окна начиная с первой свободной даты
  let run = 0;
  for (let i = firstFree; i < horizonDays; i++) {
    if (busyIsoSet.has(isoFromUtc(today + i * DAY_MS))) break;
    run++;
  }

  return {
    isFree: firstFree === 0,
    freeDays: run,
    freeFromIso: isoFromUtc(today + firstFree * DAY_MS),
  };
}
