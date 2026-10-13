#!/bin/bash
# PostgreSQL 17 primary (5432) + streaming replica (5433) on one host, trust auth (test only).
set -eu
B=${PG_BIN:-/usr/lib/postgresql/17/bin}
P=${PG_DATA_PRIMARY:-/tmp/pgp}; R=${PG_DATA_REPLICA:-/tmp/pgr}
$B/initdb -D "$P" -U postgres --auth=trust
cat >> "$P/postgresql.conf" <<CONF
port=5432
wal_level=replica
max_wal_senders=5
shared_buffers=256MB
listen_addresses='127.0.0.1'
unix_socket_directories='/tmp'
CONF
echo 'host replication all 127.0.0.1/32 trust' >> "$P/pg_hba.conf"
$B/pg_ctl -D "$P" -l "$P.log" start
$B/pg_basebackup -h 127.0.0.1 -p 5432 -U postgres -D "$R" -R
sed -i 's/^port=5432/port=5433/' "$R/postgresql.conf"
$B/pg_ctl -D "$R" -l "$R.log" start
for d in prisma drizzle mikro; do psql -h 127.0.0.1 -U postgres -qc "create database b_$d"; done
