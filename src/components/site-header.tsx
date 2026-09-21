import Link from 'next/link';
import { Palmtree, LogIn, ArrowRight } from 'lucide-react';
import { SITE_NAME } from '@/lib/constants';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-[0_1px_0_rgb(24_12%_16%/0.02)] backdrop-blur-md">
      <div className="container flex h-14 items-center justify-between">
        <Link href="/" className="group flex items-center gap-2 font-semibold text-primary">
          <span className="rounded-lg bg-gradient-to-br from-primary to-teal-600 p-1.5 text-white shadow-soft transition-transform duration-300 group-hover:rotate-6">
            <Palmtree className="h-4 w-4" />
          </span>
          <span className="text-lg tracking-tight">{SITE_NAME}</span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" asChild className="group">
            <Link href="/">
              Каталог
              <span className="block h-0.5 max-w-0 rounded-full bg-primary transition-all duration-300 group-hover:max-w-full" aria-hidden />
            </Link>
          </Button>
          {user ? (
            <Button size="sm" asChild className="group">
              <Link href={user.role === 'ADMIN' ? '/admin' : '/owner'}>
                CRM
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
              </Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" asChild className="group">
              <Link href="/login">
                <LogIn className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                <span className="hidden sm:inline">Войти</span>
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
