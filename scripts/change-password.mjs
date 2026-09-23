/**
 * Смена пароля пользователя CRM.
 *
 * Использование (внутри контейнера app):
 *   node scripts/change-password.mjs email новый_пароль
 *
 * На сервере:
 *   docker compose exec app node scripts/change-password.mjs admin@site.ru НовыйПароль123
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const [email, password] = process.argv.slice(2);

if (!email || !password) {
  console.log('Использование: node scripts/change-password.mjs email новый_пароль');
  process.exit(1);
}
if (password.length < 8) {
  console.log('Пароль должен быть не короче 8 символов');
  process.exit(1);
}

const prisma = new PrismaClient();
try {
  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { passwordHash: await bcrypt.hash(password, 10) },
  });
  console.log(`✔ Пароль обновлён: ${user.email} (${user.role})`);
} catch (e) {
  console.error('Пользователь не найден или ошибка:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
