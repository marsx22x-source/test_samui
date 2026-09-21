'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, setPending] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);

    const fd = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      redirect: false,
      email: String(fd.get('email') || ''),
      password: String(fd.get('password') || ''),
    }).catch(() => ({ error: 'unknown' }));

    if (!res || res.error) {
      setError('Неверный email или пароль');
      setPending(false);
      return;
    }

    // Успех — узнаём роль и перенаправляем в свой раздел
    try {
      const session = await fetch('/api/auth/session').then((r) => r.json());
      router.push(session?.user?.role === 'ADMIN' ? '/admin' : '/owner');
      router.refresh();
    } catch {
      setError('Не удалось завершить вход, попробуйте ещё раз');
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Авторизация</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required placeholder="admin@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm font-medium text-destructive">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={pending}>
            <LogIn className="h-4 w-4" /> {pending ? 'Входим…' : 'Войти'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
