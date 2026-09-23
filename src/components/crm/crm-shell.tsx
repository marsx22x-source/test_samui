'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { LayoutDashboard, Building2, Inbox, CalendarDays, Users, LogOut, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { pageTransition } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { SITE_NAME } from '@/lib/constants';

export type CrmLink = { href: string; label: string; icon: React.ComponentType<{ className?: string }> };

export const ADMIN_LINKS: CrmLink[] = [
  { href: '/admin', label: 'Дашборд', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Объекты', icon: Building2 },
  { href: '/admin/leads', label: 'Заявки', icon: Inbox },
  { href: '/admin/calendar', label: 'Календарь', icon: CalendarDays },
  { href: '/admin/owners', label: 'Владельцы', icon: Users },
];

// Владелец управляет только календарём занятости — заявки видит исключительно админ
export const OWNER_LINKS: CrmLink[] = [
  { href: '/owner', label: 'Мои объекты', icon: Building2 },
];

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '·';
  return (parts[0][0] + (parts[1]?.[0] ?? '')).toUpperCase();
}

/** Оболочка CRM: на десктопе — сайдбар, на мобильных — верхняя навигация со скроллом. */
export function CrmShell({
  role,
  userName,
  links,
  children,
}: {
  role: 'ADMIN' | 'OWNER';
  userName: string;
  links: CrmLink[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const nav = (
    <nav className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {links.map((link) => {
        const active = link.href === '/admin' || link.href === '/owner' ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'group flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-primary to-teal-600 text-white shadow-soft'
                : 'text-muted-foreground hover:translate-x-0.5 hover:bg-accent/70 hover:text-foreground md:hover:translate-x-1',
            )}
          >
            <link.icon
              className={cn(
                'h-4 w-4 transition-transform duration-200 group-hover:scale-110',
                active && 'text-white',
              )}
            />
            {link.label}
            {active && <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-white/90 md:block" aria-hidden />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-card/85 backdrop-blur-md">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href={role === 'ADMIN' ? '/admin' : '/owner'} className="flex items-center gap-2 font-semibold text-primary">
            <span className="rounded-md bg-gradient-to-br from-primary to-teal-600 p-1 text-white">
              <Building2 className="h-3.5 w-3.5" />
            </span>
            {SITE_NAME} · {role === 'ADMIN' ? 'Админка' : 'Кабинет'}
          </Link>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" asChild className="group">
              <Link href="/" target="_blank">
                <ExternalLink className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                <span className="hidden sm:inline">Сайт</span>
              </Link>
            </Button>
            <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-teal-600/20 text-xs font-bold text-primary">
                {initials(userName)}
              </span>
              {userName}
            </span>
            <Button variant="ghost" size="sm" onClick={() => void signOut({ callbackUrl: '/login' })}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-56 shrink-0 border-r bg-card p-3 md:block">
          {nav}
        </aside>
        {/* Мобильная навигация — нижняя панель */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-card/90 p-2 backdrop-blur-md md:hidden">{nav}</div>
        <main className="min-w-0 flex-1 p-4 pb-24 md:p-6 md:pb-6">
          {/* Плавная смена страниц CRM */}
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={pathname} variants={pageTransition} initial="initial" animate="animate" exit="exit">
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
