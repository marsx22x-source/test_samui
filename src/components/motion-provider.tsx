'use client';

import { MotionConfig } from 'framer-motion';

/**
 * Глобальный конфиг motion: уважает системную настройку
 * «уменьшить анимации» (transform-анимации автоматически отключаются).
 */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
