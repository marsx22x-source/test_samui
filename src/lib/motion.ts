/**
 * Типизированные design-токены для анимаций (framer-motion).
 * Все варианты анимаций описаны здесь как Variants — компоненты только
 * ссылаются на них, ничего строкового.
 */
import type { Transition, Variants } from 'framer-motion';

/** Фирменная кривая «плавный выезд» */
export const EASE_OUT: [number, number, number, number] = [0.22, 0.61, 0.36, 1];

export const SPRING: Transition = { type: 'spring', stiffness: 400, damping: 28 };

/** Появление блока снизу (вход секций, карточек) */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE_OUT } },
};

/** Контейнер для каскадного появления детей */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.05 } },
};

export const staggerItem: Variants = fadeUp;

/** Смена страницы: подъём на входе, уход вверх на выходе */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.14, ease: 'easeIn' } },
};

/** Направленная смена месяца календаря (custom = 1 | -1) */
export const monthSlide: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: 28 * dir }),
  center: { opacity: 1, x: 0, transition: { duration: 0.22, ease: EASE_OUT } },
  exit: (dir: number) => ({ opacity: 0, x: -28 * dir, transition: { duration: 0.18, ease: 'easeIn' } }),
};

/** Пружинящее появление (например, баннер успеха) */
export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: SPRING },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } },
};
