-- Run against b_bench after creating it from a migrated schema (recorded run: CREATE DATABASE b_bench TEMPLATE b_drizzle).
create extension if not exists pgcrypto;
insert into tenants(id,tenant_name,storage_profile,created_at,updated_at) values ('00000000-0000-7000-8000-000000000001','tenant-a','public-cdn',now(),now()),('00000000-0000-7000-8000-000000000002','other','private',now(),now());
insert into comments(id,tenant_id,parent_id,union_id,content,status,text_status,created_at,updated_at)
select ('00000000-0000-7000-9000-'||lpad(g::text,12,'0'))::uuid,'00000000-0000-7000-8000-000000000001',null,null,'','public','public',now()-interval '400 days',now() from generate_series(0,50) g;
insert into comments(id,tenant_id,parent_id,union_id,content,status,text_status,popularity_score,created_at,updated_at)
select gen_random_uuid(),'00000000-0000-7000-8000-000000000001',
 ('00000000-0000-7000-9000-'||lpad((case when g<=200000 then 0 else 1+(g%50) end)::text,12,'0'))::uuid,
 (1+(g%100000))::text, 'comment body '||g,
 (case when g%20=0 then 'pending' when g%50=0 then 'hidden' else 'public' end)::comment_status,'public',
 (g::bigint*7919)%1000, timestamptz '2026-10-01' - make_interval(secs=>(g/2)*10), now()
from generate_series(1,1000000) g;
insert into accounts(union_id,nickname,account_created_at,account_status,created_at,updated_at)
select g::text,'user'||g,now()-interval '1 year','active',now(),now() from generate_series(1,100000) g;
vacuum analyze;
