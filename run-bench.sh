#!/bin/bash
# 3 rounds; ORM order rotates each round. Requires Node 24 on PATH and DBs from scripts/setup-pg.sh + scripts/seed.sql.
set -u
cd "$(dirname "$0")"
PGHOST=${PGHOST:-127.0.0.1}
orders=("prisma drizzle mikro" "drizzle mikro prisma" "mikro prisma drizzle")
for r in 1 2 3; do
  # NOTE: in the recorded run these two statements were sent in one -c and failed ("VACUUM cannot run inside a transaction block").
  psql -h "$PGHOST" -U postgres -d b_bench -qc "vacuum analyze comments"
  psql -h "$PGHOST" -U postgres -d b_bench -qc "vacuum analyze accounts"
  for d in ${orders[$((r-1))]}; do (cd "$d" && node --expose-gc --import tsx src/bench.ts "$r") || echo "FAIL $d $r"; done
done
echo BENCH_DONE
