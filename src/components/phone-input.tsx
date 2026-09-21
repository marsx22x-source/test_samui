'use client';

import * as React from 'react';
import { Input, type InputProps } from '@/components/ui/input';

/**
 * Маска телефона. Номера, начинающиеся с 7/8, форматируются как +7 (999) 123-45-67,
 * любые другие (например, +66…) — просто + и цифры (до 15, стандарт E.164).
 */
export function PhoneInput(props: InputProps) {
  const { value, onChange, ...rest } = props;
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    let d = e.target.value.replace(/\D/g, '');
    if (!d) {
      e.target.value = '';
      onChange?.(e);
      return;
    }
    if (d[0] === '8') d = '7' + d.slice(1);

    let out: string;
    if (d[0] === '7') {
      d = d.slice(0, 11);
      const r = d.slice(1);
      out = '+7';
      if (r.length > 0) out += ` (${r.slice(0, 3)}`;
      if (r.length >= 3) out += ')';
      if (r.length > 3) out += ` ${r.slice(3, 6)}`;
      if (r.length > 6) out += `-${r.slice(6, 8)}`;
      if (r.length > 8) out += `-${r.slice(8, 10)}`;
    } else {
      d = d.slice(0, 15);
      out = '+' + d;
    }

    e.target.value = out;
    onChange?.(e);
  };
  return <Input inputMode="tel" placeholder="+7 (___) ___-__-__" {...rest} onChange={handle} value={value} />;
}
