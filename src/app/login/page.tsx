import Link from 'next/link';
import { Palmtree } from 'lucide-react';
import { LoginForm } from '@/components/login-form';
import { SITE_NAME } from '@/lib/constants';

export const metadata = { title: 'Вход в CRM' };

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-secondary/60 p-4">
      {/* Анимированный фон */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 animate-blob rounded-full bg-primary/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 animate-blob rounded-full bg-amber-300/20 blur-3xl [animation-delay:5s]" aria-hidden />
      <div className="pointer-events-none absolute left-1/2 top-1/3 h-56 w-56 -translate-x-1/2 animate-float rounded-full bg-teal-400/10 blur-3xl" aria-hidden />

      <div className="relative w-full max-w-sm animate-fade-in-up">
        <div className="mb-6 text-center">
          <Link href="/" className="group inline-flex items-center gap-2 font-semibold text-primary">
            <span className="animate-float rounded-xl bg-gradient-to-br from-primary to-teal-600 p-2.5 text-white shadow-lift">
              <Palmtree className="h-6 w-6" />
            </span>
            <span className="text-2xl tracking-tight">{SITE_NAME}</span>
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">Вход в CRM для администраторов и владельцев</p>
        </div>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="underline-offset-4 transition-colors hover:text-primary">← Вернуться на сайт</Link>
        </p>
      </div>
    </div>
  );
}
