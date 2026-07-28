#!/bin/sh
# Container entrypoint: apply migrations, then serve.
#
# This exists because a deploy WITHOUT it shipped code that needed a column the
# database did not have. Every trace batch 500'd; the browser retried that batch
# every two seconds, taking a per-session database lock each time; answer checking
# contended behind those failing transactions and began timing out; and the client,
# getting no verdict back, fell back to calling every answer correct.
#
# A schema change and the code that needs it arrive in the SAME deploy, so they
# have to be applied in the same step. Never rely on someone remembering.
set -e

echo "[start] applying database migrations…"
npx prisma migrate deploy --schema packages/db/prisma/schema.prisma

echo "[start] serving…"
exec npm run start --workspace @judge/web
