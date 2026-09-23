# syntax=docker/dockerfile:1

# ============================================================ deps
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json* ./
# Схема нужна уже на этом шаге: postinstall (npm ci) запускает prisma generate
COPY prisma ./prisma
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ============================================================ builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Ключи не нужны на этапе сборки; генерируем клиент Prisma и собираем standalone
RUN npm run build

# ============================================================ runner
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Standalone-выход Next.js: минимальный server.js + трассированные зависимости
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# Prisma CLI + engines + сгенерированный клиент для миграций и сидинга в рантайме
COPY --from=builder --chown=node:node /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
# Для scripts/seed.mjs (он вне графа трассировки Next): bcryptjs + nodemailer
COPY --from=builder --chown=node:node /app/node_modules/bcryptjs ./node_modules/bcryptjs
COPY --from=builder --chown=node:node /app/node_modules/nodemailer ./node_modules/nodemailer
COPY --from=builder --chown=node:node /app/prisma ./prisma
COPY --from=builder --chown=node:node /app/scripts ./scripts

COPY --chown=node:node docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh \
    && mkdir -p /app/uploads \
    && chown -R node:node /app/uploads

# Непривилегированный пользователь
USER node
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
