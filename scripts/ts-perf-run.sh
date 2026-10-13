#!/bin/bash
# tsc type-check perf: drizzle 0.45.4 (RQB v1), drizzle 1.0.0-rc.4 (RQB v2), prisma 7.10.0.
# Needs: WORK dir with d045/ d1rc/ prisma/ each holding node_modules (see README in ts-perf.md).
# Output: raw/ts-perf/N<n>-<variant>-run<k>.txt, raw/ts-perf/N<n>-<variant>-incr.txt
set -u
cd "$(dirname "$0")/.."
OUT=raw/ts-perf; GEN=scripts/ts-perf-gen.py
WORK=${WORK:?set WORK to the dir holding d045/ d1rc/ prisma/ installs}
mkdir -p "$OUT"
for N in ${SIZES:-10 50 100 200}; do
  G="$WORK/g$N"; rm -rf "$G"; mkdir -p "$G"
  python3 "$GEN" "$N" "$G" > "$OUT/N$N-gen.txt"
  for v in d045 d1rc prisma; do ln -sfn "$WORK/$v/node_modules" "$G/$v/node_modules"; done
  (cd "$G/prisma" && node node_modules/prisma/build/index.js generate > /dev/null 2>&1 && wc -l src/generated/*.ts src/generated/models/*.ts | tail -1) > "$OUT/N$N-prisma-generated-lines.txt"
  wc -l "$G"/d045/src/*.ts "$G"/d1rc/src/*.ts "$G"/prisma/prisma/schema.prisma "$G"/prisma/src/queries.ts > "$OUT/N$N-source-lines.txt"
  for v in d045 d1rc prisma; do
    for k in 1 2 3; do
      (cd "$G/$v" && node node_modules/typescript/bin/tsc -p . --extendedDiagnostics --incremental false; echo "exit=$?") > "$OUT/N$N-$v-run$k.txt" 2>&1
    done
    # incremental: cold build, then edit one line in queries.ts and rebuild
    (cd "$G/$v" && rm -f tsconfig.tsbuildinfo &&
      echo "### cold incremental" && node node_modules/typescript/bin/tsc -p . --incremental --tsBuildInfoFile tsconfig.tsbuildinfo --extendedDiagnostics; echo "exit=$?";
      echo "// edit" >> src/queries.ts;
      echo "### after 1-line edit in queries.ts" && node node_modules/typescript/bin/tsc -p . --incremental --tsBuildInfoFile tsconfig.tsbuildinfo --extendedDiagnostics; echo "exit=$?") > "$OUT/N$N-$v-incr.txt" 2>&1
  done
done
echo TS_PERF_DONE
