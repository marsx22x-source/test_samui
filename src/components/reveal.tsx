'use client';

import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';

/**
 * Появление блока при скролле — полностью на React/TS (framer-motion whileInView).
 * Используется только в закрытых разделах CRM, поэтому безопасно стартует скрытым.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -32px 0px' }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
