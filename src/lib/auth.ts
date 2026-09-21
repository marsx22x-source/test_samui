import 'next-auth';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';

export type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  role: 'ADMIN' | 'OWNER';
};

/** Текущий пользователь или null (для публичных страниц). */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.role) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role,
  };
}

/** Требует авторизацию и конкретную роль, иначе — редирект. */
export async function requireRole(roles: Array<'ADMIN' | 'OWNER'>): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  if (!roles.includes(user.role)) {
    redirect(user.role === 'ADMIN' ? '/admin' : '/owner');
  }
  return user;
}
