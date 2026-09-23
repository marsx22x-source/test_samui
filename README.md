# Samui Rentals — аренда недвижимости (витрина + CRM)

Адаптивное веб-приложение типа «мини Airbnb/Booking»: публичный каталог объектов с
онлайн-календарём занятости и формой бронирования, CRM для администратора и кабинет
владельца. Уведомления о заявках в Telegram, WhatsApp и на Email. Продакшн-деплой —
одной командой через Docker Compose (Next.js + PostgreSQL + Nginx + Let's Encrypt).

## Стек

- **Next.js 14** (App Router, Server Actions, TypeScript), `output: standalone`
- **Tailwind CSS** + UI-компоненты в стиле **shadcn/ui** (`src/components/ui`)
- **framer-motion** — типизированные анимации на React (`src/lib/motion.ts`)
- **PostgreSQL 16 + Prisma ORM** (миграции накатываются автоматически при старте)
- **Auth.js / NextAuth v4** — Credentials, JWT, роли `ADMIN` и `OWNER`
- Уведомления: **Telegram Bot API**, **WhatsApp** (Green-API или Meta Cloud API), **SMTP** (nodemailer)
- DevOps: multi-stage **Dockerfile** (node:20-alpine, non-root), **docker-compose**, **Nginx** reverse proxy + **Certbot**

## Роли и возможности

| | Гость | Администратор | Владелец |
|---|---|---|---|
| Каталог: текстовый поиск, 15+ фильтров (локация, тип, цена, гости, спальни, ванные, площадь, до пляжа, удобства, питомцы, курение, рейтинг, свободные даты), сортировка, быстрые пресеты | ✅ | — | — |
| Карточка объекта: галерея, календарь занятости, правила жилья, отзывы, бронирование с расчётом итога | ✅ | — | — |
| CRUD объектов (расширенные поля: ванные, депозит, мин. срок, правила, расстояние до пляжа), фото, отзывы, публикация | — | ✅ | — |
| Управление владельцами (email, пароль, TG chat_id, WA телефон) | — | ✅ | — |
| Общий календарь всех объектов + принудительное перекрытие дат | — | ✅ | — |
| Все заявки: поиск по имени/телефону/комментарию, смена статусов (Новый → В обработке → Подтверждён/Отказ) | — | ✅ | — |
| Свои объекты, переключение дней «Свободно/Занято» в 1 клик | — | — | ✅ |
| Заявки (просмотр, статусы, уведомления) | — | ✅ | — |

Владелец управляет **только календарём занятости** своих объектов: все заявки
гостей видит и обрабатывает исключительно администратор (раздел «Заявки» +
уведомления TG/WhatsApp/email приходят только админам).

Любые изменения (правки объектов, переключение дней календаря) мгновенно отражаются
на сайте за счёт `revalidatePath` в Server Actions.

## Структура

```
prisma/schema.prisma          # User, Property, PropertyImage, CalendarDay, Lead
src/app/                      # витрина: /, /property/[slug], /login
src/app/admin/                # CRM: дашборд, объекты, заявки, календарь, владельцы
src/app/owner/                # кабинет владельца: объекты + календарь занятости
src/actions/                  # Server Actions (заявка+рассылка, календарь, CRUD)
src/services/notifications.ts # Telegram / WhatsApp / Email
src/lib/motion.ts             # типизированные variants для framer-motion
src/middleware.ts             # RBAC-защита /admin и /owner
Dockerfile                    # multi-stage: deps → builder → runner (standalone)
docker-compose.yml            # app + postgres + nginx + certbot
docker-entrypoint.sh          # prisma migrate deploy перед стартом Next.js
init-letsencrypt.sh           # первичный выпуск SSL (webroot, без простоя)
deploy.sh                     # деплой: --init / обновление / --seed
nginx/templates/              # nginx-конфиг с SSL (для домена)
nginx/templates-ip/           # nginx-конфиг HTTP-only (для работы по IP)
```

---

## Развёртывание на чистом VPS (Ubuntu/Debian)

### 0. Выбор ОС и сервера

**Рекомендация: Ubuntu Server 24.04 LTS** (или 22.04 LTS / Debian 12 — тоже полностью поддерживаются).

Приложение целиком работает в Docker (контейнеры на базе alpine), поэтому от хоста нужно
немногое: свежее ядро Linux, Docker и bash. Скрипты `deploy.sh` / `init-letsencrypt.sh`
написаны под Debian-семейство (bash, `apt-get`, `getent`, `openssl`) — на Ubuntu/Debian
запускаются без правок.

| ОС | Вердикт |
|---|---|
| **Ubuntu Server 24.04/22.04 LTS** | ✅ Рекомендуется: 5 лет обновлений, официальный Docker, скрипты работают из коробки |
| **Debian 12** | ✅ Полная совместимость, чуть минималистичнее — если привычнее |
| Alpine (как хост) | ⚠️ Не рекомендуется: ash вместо bash — скрипты потребуют правок |
| Rocky/Alma/CentOS | ⚠️ dnf вместо apt + SELinux может мешать bind-mount `docker-data` |
| Windows Server | ❌ Bash-скрипты не работают, Docker через WSL2, хуже производительность |

Практические советы:
- Берите **Server-образ без GUI** (без рабочего стола — меньше памяти и поверхности атаки).
- Минимум **2 ГБ RAM / 2 vCPU** (сборка Next.js + Postgres + Nginx). На 1 ГБ добавьте swap 2 ГБ.
- Регион VPS — ближе к основной аудитории сайта.
- После установки ОС: `ufw allow 22,80,443 && ufw enable`.

### 1. Установить Docker (одна команда)

```bash
curl -fsSL https://get.docker.com | sh
```

### 2. Склонировать проект и настроить окружение

```bash
git clone <ваш-репозиторий> /opt/samui && cd /opt/samui
cp .env.example .env
nano .env
```

Минимально заполнить в `.env`:

| Переменная | Что указать |
|---|---|
| `DOMAIN` | ваш домен без `https://` (DNS A-запись должна указывать на IP сервера) |
| `LETSENCRYPT_EMAIL` | почта для Let's Encrypt |
| `POSTGRES_PASSWORD` | пароль БД — **только буквы/цифры** |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `https://ваш-домен` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | логин/пароль первого администратора |
| `TG_BOT_TOKEN`, `TG_ADMIN_CHAT_ID` | токен бота от @BotFather и chat_id чата админов |
| `SMTP_*` | параметры почты для e-mail уведомлений |

Неиспользуемые каналы уведомлений можно оставить пустыми — они просто отключатся.

### 3. Первый запуск (SSL + миграции + админ)

```bash
./deploy.sh --init
```

Скрипт: выпустит сертификат Let's Encrypt, соберёт образы, поднимет
`postgres + app + nginx`, накатит миграции (`prisma migrate deploy` выполняется
автоматически в entrypoint) и создаст администратора из `SEED_ADMIN_*`.

Готово: сайт — `https://ваш-домен`, CRM — `https://ваш-домен/login`.

#### Пока нет домена: деплой по белому IP

1. В `.env`: `DOMAIN=<IP сервера>`, `NEXTAUTH_URL=http://<IP сервера>` (без https!),
   раскомментируйте `NGINX_TEMPLATE=-ip`.
2. Запустите `./deploy.sh --init` — скрипт сам увидит IP-режим и пропустит выпуск
   сертификата. Сайт и CRM будут доступны по `http://<IP>`.

Когда появится домен: создайте DNS A-запись домена → IP сервера, в `.env` впишите
`DOMAIN=домен`, `NEXTAUTH_URL=https://домен`, закомментируйте обратно
`NGINX_TEMPLATE` и выполните `./deploy.sh --init` — SSL выпустится автоматически,
все данные (БД, фото, заявки) сохранятся.

> В IP-режиме сайт работает без HTTPS — браузер пометит его «Не защищено». Для
> тестирования это нормально, для реальных гостей лучше включить домен + SSL.

### 4. Обновления

```bash
./deploy.sh            # git pull → build → up -d (пара секунд простоя на перезапуск)
./deploy.sh --no-pull  # обновление без git pull
./deploy.sh --seed     # пересоздать админа/демо-данные
```

### 5. Автопродление SSL (cron на хосте)

```bash
crontab -e
# Каждые 12 часов — продление и reload nginx, если сертификат обновился:
0 */12 * * * cd /opt/samui && docker compose run --rm certbot renew --quiet && docker compose exec nginx nginx -s reload
```

> Контейнер `certbot` в `docker compose ps` может отображаться как «exited» — это нормально:
> он запускается разово (из cron или init-скриптом), а не как демон.

### 6. Бэкапы (cron на хосте)

```bash
crontab -e
# Ежедневно в 4:00 — дамп БД с хранением 7 дней (замените samui на ваши POSTGRES_USER/POSTGRES_DB):
0 4 * * * cd /opt/samui && docker compose exec -T postgres pg_dump -U samui samui | gzip > /root/backups/db-$(date +\%F).sql.gz && find /root/backups -name 'db-*.sql.gz' -mtime +7 -delete
```

Фотографии лежат в volume `uploads` — при переезде скопируйте его:
`docker run --rm -v samui-rentals_uploads:/from -v /root/uploads-backup:/to alpine cp -r /from /to`

### Эксплуатация

- **Логи**: `docker compose logs -f app` (приложение), `logs -f nginx` (веб-сервер).
- **Ротация логов Docker** (иначе json-логи растут бесконечно) — `/etc/docker/daemon.json`:
  ```json
  { "log-driver": "local", "log-opts": { "max-size": "10m", "max-file": "3" } }
  ```
  затем `systemctl restart docker`.
- **Логин защищён rate-limit**: 10 неудачных попыток на email за 15 минут.

### Если что-то пошло не так

| Симптом | Что смотреть |
|---|---|
| 502 Bad Gateway | `docker compose logs app` — приложение ещё поднимается или упало |
| certbot: «Failed authorization» | DNS A-запись домена не указывает на IP сервера, либо закрыт порт 80 |
| Ошибка миграций при старте | `docker compose logs app` (entrypoint печатает вывод `prisma migrate deploy`) |
| Уведомления не приходят | логи `app`: строки `[notify] ошибка канала ...`; проверьте токены в `.env` |
| Изменения не видны на сайте | `docker compose exec app wget -qO- localhost:3000/api/health`; при CDN — сбросьте кэш |

### Локальная разработка

```bash
cp .env.example .env                # DATABASE_URL на локальную БД
npm install
npx prisma migrate deploy           # или prisma db push для прототипирования
npm run db:seed                     # админ + (SEED_DEMO=true) демо-объекты
npm run dev                         # http://localhost:3000
```

## Настройка уведомлений

- **Telegram**: создайте бота у @BotFather → токен в `TG_BOT_TOKEN`. Добавьте бота
  в чат админов, узнайте chat_id через @userinfobot → `TG_ADMIN_CHAT_ID`.
  Персональный chat_id владельца задаётся в карточке владельца в CRM.
- **WhatsApp (Green-API)**: зарегистрируйтесь на green-api.com, создайте инстанс →
  `WHATSAPP_PROVIDER=green-api`, `WHATSAPP_GREEN_API_INSTANCE_ID`, `WHATSAPP_GREEN_API_TOKEN`,
  номера получателей — в `WHATSAPP_ADMIN_PHONE` и в карточке владельца.
- **Email**: любые SMTP-креды (Яндекс, Mail.ru, SendGrid…) → `SMTP_*`.
