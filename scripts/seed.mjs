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
        deposit: 15000,
        minNights: 2,
        propertyType: 'Вилла',
        location: 'о. Самуи, Чавенг',
        address: 'Choeng Mon Beach Rd, 12',
        maxGuests: 8,
        bedrooms: 3,
        bathrooms: 3,
        area: 220,
        distanceToBeach: 450,
        checkInTime: '14:00',
        checkOutTime: '12:00',
        allowPets: true,
        allowSmoking: false,
        amenities: ['Wi-Fi', 'Кондиционер', 'Кухня', 'Бассейн', 'Вид на море', 'Парковка', 'Стиральная машина'],
        reviews: [
          { authorName: 'Дмитрий', rating: 5, text: 'Вилла ещё лучше, чем на фото. Бассейн чистый, вид невероятный, хозяйка отвечает моментально. Обязательно вернёмся!' },
          { authorName: 'Мария', rating: 5, text: 'Отличная вилла для большой семьи. Тихо, просторно, до пляжа реально 7 минут. Все удобства работают.' },
          { authorName: 'Алексей', rating: 4, text: 'Хороший дом, всё соответствует описанию. Единственное — дорога к вилле крутая, на байке аккуратнее.' },
        ],
      },
      {
        title: 'Уютные апартаменты у пляжа',
        slug: 'apartments-beach',
        description:
          'Светлые апартаменты в двух минутах от пляжа. Идеально для пары или небольшой семьи: оборудованная кухня, балкон, быстрый Wi-Fi для удалённой работы.',
        pricePerNight: 4500,
        deposit: null,
        minNights: 1,
        propertyType: 'Апартаменты',
        location: 'о. Самуи, Ламай',
        address: 'Lamai Beach Soi 4',
        maxGuests: 4,
        bedrooms: 1,
        bathrooms: 1,
        area: 55,
        distanceToBeach: 200,
        checkInTime: '13:00',
        checkOutTime: '11:00',
        allowPets: false,
        allowSmoking: false,
        amenities: ['Wi-Fi', 'Кондиционер', 'Кухня', 'Smart TV', 'Фен', 'Горячая вода'],
        reviews: [
          { authorName: 'Ольга', rating: 5, text: 'Идеальные апартаменты за свои деньги: чисто, тихо, море рядом. Кондиционер холодит отлично.' },
          { authorName: 'Игорь', rating: 4, text: 'Всё понравилось. Кухня укомплектована, можно готовить. Wi-Fi стабилен, работал удалённо без проблем.' },
        ],
      },
      {
        title: 'Бунгало в тропическом саду',
        slug: 'bungalow-garden',
        description:
          'Традиционное тайское бунгало в тени пальм. Гамак на веранде, пение птиц по утрам и полный релакс. Общая территория с садом и лежаками.',
        pricePerNight: 2800,
        deposit: null,
        minNights: 2,
        propertyType: 'Бунгало',
        location: 'о. Самуи, Маенам',
        address: 'Maenam Soi 5',
        maxGuests: 2,
        bedrooms: 1,
        bathrooms: 1,
        area: 32,
        distanceToBeach: 900,
        checkInTime: '12:00',
        checkOutTime: '10:00',
        allowPets: true,
        allowSmoking: true,
        amenities: ['Wi-Fi', 'Кондиционер', 'Завтрак', 'Фен'],
        reviews: [
          { authorName: 'Анна', rating: 5, text: 'Настоящий тропический отдых! Гамак, пальмы, завтраки в саду. До пляжа неспешным шагом 10 минут.' },
        ],
      },
    ];

    for (const d of demo) {
      const existing = await prisma.property.findUnique({ where: { slug: d.slug } });
      if (existing) continue;
      const { reviews, ...data } = d;
      const property = await prisma.property.create({
        data: { ...data, isPublished: true, ownerId: owner.id },
      });
      await prisma.propertyImage.createMany({
        data: [
          { url: `https://picsum.photos/seed/${d.slug}-1/1200/800`, sortOrder: 0, propertyId: property.id },
          { url: `https://picsum.photos/seed/${d.slug}-2/1200/800`, sortOrder: 1, propertyId: property.id },
          { url: `https://picsum.photos/seed/${d.slug}-3/1200/800`, sortOrder: 2, propertyId: property.id },
        ],
      });
      if (reviews?.length) {
        await prisma.review.createMany({
          data: reviews.map((r, i) => ({
            propertyId: property.id,
            authorName: r.authorName,
            rating: r.rating,
            text: r.text,
            createdAt: new Date(Date.now() - (i + 1) * 7 * 86_400_000),
          })),
        });
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        await prisma.property.update({
          where: { id: property.id },
          data: {
            ratingAvg: sum / reviews.length,
            ratingCount: reviews.length,
          },
        });
      }
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
