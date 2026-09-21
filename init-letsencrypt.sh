#!/usr/bin/env bash
# =====================================================================
# Первичный выпуск SSL-сертификата Let's Encrypt (webroot, без простоя).
# Использование: ./init-letsencrypt.sh  (запускается из deploy.sh --init)
# Требует: заполненные DOMAIN и LETSENCRYPT_EMAIL в .env, DNS A-запись
# домена на этот сервер, установленный openssl на хосте.
# =====================================================================
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "ОШИБКА: нет файла .env (cp .env.example .env)" >&2
  exit 1
fi

if ! command -v openssl >/dev/null 2>&1; then
  echo "ОШИБКА: openssl не найден в системе. Установите: apt-get install -y openssl" >&2
  exit 1
fi

# Читаем переменные из .env (без shell-инъекций)
DOMAIN=$( (grep -E '^DOMAIN=' .env || true) | head -1 | cut -d= -f2- | sed "s/[\r\"']//g")
EMAIL=$( (grep -E '^LETSENCRYPT_EMAIL=' .env || true) | head -1 | cut -d= -f2- | sed "s/[\r\"']//g")

if [ -z "${DOMAIN}" ] || [ "${DOMAIN}" = "example.com" ]; then
  echo "ОШИБКА: укажите реальный DOMAIN в .env" >&2
  exit 1
fi
if [ -z "${EMAIL}" ]; then
  echo "ОШИБКА: укажите LETSENCRYPT_EMAIL в .env" >&2
  exit 1
fi

# Предварительная проверка DNS: домен должен указывать на этот сервер
if command -v getent >/dev/null 2>&1; then
  RESOLVED=$(getent hosts "${DOMAIN}" | awk '{print $1}' | head -1 || true)
  if [ -z "${RESOLVED}" ]; then
    echo "ВНИМАНИЕ: домен ${DOMAIN} не резолвится. Создайте DNS A-запись на IP этого сервера." >&2
    echo "Продолжаю, но certbot, скорее всего, завершится с ошибкой..." >&2
    sleep 3
  fi
fi

DATA_DIR=./docker-data
CERT_DIR="${DATA_DIR}/letsencrypt/live/${DOMAIN}"

echo "== [1/5] Подготовка каталогов и временного self-signed сертификата =="
mkdir -p "${DATA_DIR}/certbot" "${CERT_DIR}"

if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout "${CERT_DIR}/privkey.pem" \
    -out "${CERT_DIR}/fullchain.pem" \
    -subj "/CN=${DOMAIN}" 2>/dev/null
fi

echo "== [2/5] Сборка и запуск всех сервисов (это может занять несколько минут) =="
docker compose up -d --build

echo "== [3/5] Ожидание Nginx (10 сек) =="
sleep 10

echo "== [4/5] Удаление временного сертификата и выпуск настоящего =="
# Nginx уже загрузил dummy-сертификат в память — файлы можно удалить,
# это освобождает путь для честных симлинков certbot.
rm -rf "${CERT_DIR}"

if ! docker compose run --rm certbot certonly \
  --webroot -w /var/www/certbot \
  -d "${DOMAIN}" -d "www.${DOMAIN}" \
  --email "${EMAIL}" --agree-tos --non-interactive --no-eff-email; then
  echo "" >&2
  echo "ОШИБКА: certbot не смог выпустить сертификат." >&2
  echo "Проверьте: 1) DNS A-запись ${DOMAIN} -> IP сервера; 2) порт 80 открыт в фаерволе." >&2
  echo "Логи: docker compose logs certbot" >&2
  exit 1
fi

echo "== [5/5] Перезагрузка Nginx с настоящим сертификатом =="
docker compose exec nginx nginx -s reload

# Даём nginx секунду перечитать конфигурацию и проверяем
sleep 2
if curl -fsSI "https://${DOMAIN}" >/dev/null 2>&1; then
  echo ""
  echo "Готово! Сайт доступен по адресу: https://${DOMAIN}"
else
  echo ""
  echo "Сертификат выпущен, но https пока не отвечает. Подождите ~30 сек и проверьте:"
  echo "  curl -I https://${DOMAIN}"
  echo "  docker compose logs nginx"
fi
echo "Продление сертификата — по cron (см. README, раздел «SSL»)."
