#!/bin/sh
set -e
echo "Running Prisma migrations..."
npx prisma migrate deploy
echo "Seeding database (idempotent)..."
npx tsx prisma/seed.ts || true
exec "$@"
