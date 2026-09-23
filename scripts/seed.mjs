/**
 * Seed-скрипт: создаёт администратора (env SEED_ADMIN_*) и, при SEED_DEMO=true,
 * демо-набор: 1 владелец + 3 объекта с фото-заглушками.
 * Запуск: node scripts/seed.mjs  (или ./deploy.sh --seed)
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD || 'Admin12345';
  const name = process.env.SEED_ADMIN_NAME || 'Администратор';

  const admin = await prisma.user.upsert({
    where: { email },
    // при повторном запуске — обновляем пароль и имя из SEED_ADMIN_*
    update: { passwordHash: await bcrypt.hash(password, 10), name },
    create: {
      email,
      name,
      passwordHash: await bcrypt.hash(password, 10),
      role: 'ADMIN',
    },
  });
  console.log(`✔ Администратор готов: ${admin.email} (роль ADMIN)`);

  if (process.env.SEED_DEMO === 'true') {
    const ownerEmail = 'owner@example.com';
    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: {},
      create: {
        email: ownerEmail,
        name: 'Демо-владелец',
        passwordHash: await bcrypt.hash('Owner12345', 10),
        role: 'OWNER',
      },
    });

    const demo = [
      {
        title: 'Вилла с видом на море',
        slug: 'villa-sea-view',
        description:
          'Просторная вилла на склоне холма с панорамным видом на залив. Три спальни, собственный бассейн и терраса для завтраков на рассвете. До пляжа 7 минут пешком.',
        pricePerNight: 12000,
        propertyType: 'Вилла',
        location: 'о. Самуи, Чавенг',
        address: 'Choeng Mon Beach Rd, 12',
        maxGuests: 8,
        bedrooms: 3,
        area: 220,
        amenities: ['Wi-Fi', 'Кондиционер', 'Кухня', 'Бассейн', 'Вид на море', 'Парковка', 'Стиральная машина'],
      },
      {
        title: 'Уютные апартаменты у пляжа',
        slug: 'apartments-beach',
        description:
          'Светлые апартаменты в двух минутах от пляжа. Идеально для пары или небольшой семьи: оборудованная кухня, балкон, быстрый Wi-Fi для удалённой работы.',
        pricePerNight: 4500,
        propertyType: 'Апартаменты',
        location: 'о. Самуи, Ламай',
        address: 'Lamai Beach Soi 4',
        maxGuests: 4,
        bedrooms: 1,
        area: 55,
        amenities: ['Wi-Fi', 'Кондиционер', 'Кухня', 'Smart TV', 'Фен', 'Горячая вода'],
      },
      {
        title: 'Бунгало в тропическом саду',
        slug: 'bungalow-garden',
        description:
          'Традиционное тайское бунгало в тени пальм. Гамак на веранде, пение птиц по утрам и полный релакс. Общая территория с садом и лежаками.',
        pricePerNight: 2800,
        propertyType: 'Бунгало',
        location: 'о. Самуи, Маенам',
        address: 'Maenam Soi 5',
        maxGuests: 2,
        bedrooms: 1,
        area: 32,
        amenities: ['Wi-Fi', 'Кондиционер', 'Завтрак', 'Фен'],
      },
    ];

    for (const d of demo) {
      const existing = await prisma.property.findUnique({ where: { slug: d.slug } });
      if (existing) continue;
      const property = await prisma.property.create({
        data: { ...d, isPublished: true, ownerId: owner.id },
      });
      await prisma.propertyImage.createMany({
        data: [
          { url: `https://picsum.photos/seed/${d.slug}-1/1200/800`, sortOrder: 0, propertyId: property.id },
          { url: `https://picsum.photos/seed/${d.slug}-2/1200/800`, sortOrder: 1, propertyId: property.id },
          { url: `https://picsum.photos/seed/${d.slug}-3/1200/800`, sortOrder: 2, propertyId: property.id },
        ],
      });
      console.log(`✔ Демо-объект: ${d.title}`);
    }
    console.log('✔ Демо-владелец: owner@example.com / Owner12345');
  }
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
