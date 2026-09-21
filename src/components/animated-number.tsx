'use client';

import * as React from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';

/** Число «набегает» от 0 до value (motion values framer-motion). */
export function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => `${Math.round(v)}${suffix}`);

  React.useEffect(() => {
    const controls = animate(mv, value, { duration: 0.7, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, mv]);

  return <motion.span>{text}</motion.span>;
}
