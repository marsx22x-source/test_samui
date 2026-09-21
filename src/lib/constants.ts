export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Samui Rentals';

export const PROPERTY_TYPES = [
  'Апартаменты',
  'Дом',
  'Вилла',
  'Студия',
  'Бунгало',
  'Шале',
] as const;

export const AMENITIES = [
  'Wi-Fi',
  'Кондиционер',
  'Кухня',
  'Стиральная машина',
  'Парковка',
  'Бассейн',
  'Вид на море',
  'Smart TV',
  'Фен',
  'Утюг',
  'Горячая вода',
  'Завтрак',
] as const;

export const MESSENGERS = ['Telegram', 'WhatsApp', 'Звонок'] as const;

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый',
  IN_PROGRESS: 'В обработке',
  CONFIRMED: 'Подтверждён',
  REJECTED: 'Отказ',
};

export const LEAD_STATUSES = ['NEW', 'IN_PROGRESS', 'CONFIRMED', 'REJECTED'] as const;

export type LeadStatusValue = (typeof LEAD_STATUSES)[number];
