#!/bin/sh
set -e

echo "[entrypoint] applying database migrations..."
node ./node_modules/prisma/build/index.js migrate deploy --schema ./prisma/schema.prisma

# Опциональный сидинг (создание админа / демо-данных) — только при RUN_SEED=true
if [ "$RUN_SEED" = "true" ]; then
  echo "[entrypoint] seeding..."
  node ./scripts/seed.mjs || echo "[entrypoint] seed skipped/failed (non-fatal)"
fi

echo "[entrypoint] starting Next.js..."
exec "$@"
