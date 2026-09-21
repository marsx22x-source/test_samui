#!/usr/bin/env bash
# =====================================================================
# Деплой на VPS: первая установка и обновления.
#
#   ./deploy.sh --init      # первый запуск: SSL + сборка + старт + админ
#   ./deploy.sh             # обновление: git pull + build + up -d
#   ./deploy.sh --no-pull   # обновление без git pull
#   ./deploy.sh --seed      # обновление + создать админа/демо-данные
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

INIT=0
NO_PULL=0
SEED=0
for arg in "$@"; do
  case "$arg" in
    --init)    INIT=1 ;;
    --no-pull) NO_PULL=1 ;;
    --seed)    SEED=1 ;;
    *) echo "Неизвестный аргумент: $arg (доступны --init, --no-pull, --seed)"; exit 1 ;;
  esac
done

# --- Проверки окружения ---
if ! command -v docker >/dev/null 2>&1; then
  echo "ОШИБКА: docker не установлен. Инструкция: https://docs.docker.com/engine/install/" >&2
  exit 1
fi
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
else
  echo "ОШИБКА: не найден 'docker compose' (нужен Docker 20.10+ с compose-плагином)" >&2
  exit 1
fi

if [ ! -f .env ]; then
  echo "Файл .env не найден. Создаю из шаблона..."
  cp .env.example .env
  echo ""
  echo ">>> Заполните .env (минимум: DOMAIN, POSTGRES_PASSWORD, NEXTAUTH_SECRET) и запустите снова."
  exit 1
fi

wait_for_app() {
  echo "Ожидание приложения (миграции могут занять время)..."
  for i in $(seq 1 12); do
    if $DC exec -T app wget -qO- http://localhost:3000/api/health >/dev/null 2>&1; then
      return 0
    fi
    sleep 5
  done
  return 1
}

# --- Первый запуск с выпуском SSL ---
if [ "$INIT" = "1" ]; then
  echo "=== Первичная установка (Let's Encrypt + Docker) ==="
  bash ./init-letsencrypt.sh

  echo ""
  echo "=== Создание администратора (переменные SEED_* в .env) ==="
  SEED_EMAIL=$( (grep -E '^SEED_ADMIN_EMAIL=' .env || true) | head -1 | cut -d= -f2- | sed "s/[\r\"']//g")
  $DC run --rm app node ./scripts/seed.mjs

  if wait_for_app; then
    echo "Приложение отвечает — деплой успешен."
  else
    echo "ПРЕДУПРЕЖДЕНИЕ: приложение не отвечает. Логи: $DC logs -f app" >&2
  fi
  $DC ps
  echo ""
  echo "Вход в CRM: https://$( (grep -E '^DOMAIN=' .env || true) | head -1 | cut -d= -f2- | sed "s/[\r\"']//g")/login"
  echo "Логин: ${SEED_ADMIN_EMAIL:-admin@example.com} (пароль из SEED_ADMIN_PASSWORD в .env)"
  exit 0
fi

# --- Обновление ---
if [ "$NO_PULL" = "0" ] && [ -d .git ]; then
  echo "=== git pull ==="
  git pull --ff-only || echo "ПРЕДУПРЕЖДЕНИЕ: git pull не удался, продолжаю с текущим кодом"
fi

echo "=== Сборка и перезапуск контейнеров (пара секунд простоя на рестарт) ==="
$DC build
$DC up -d

if [ "$SEED" = "1" ]; then
  echo "=== Seed (админ/демо-данные из SEED_* в .env) ==="
  $DC run --rm app node ./scripts/seed.mjs
fi

echo "=== Health-check ==="
if wait_for_app; then
  echo "Приложение отвечает — деплой завершён."
else
  echo "ПРЕДУПРЕЖДЕНИЕ: приложение не отвечает (возможно, ещё выполняются миграции)." >&2
  echo "Подождите минуту и проверьте: $DC logs -f app" >&2
  exit 1
fi

docker image prune -f >/dev/null
$DC ps
echo ""
echo "Логи: $DC logs -f app"
