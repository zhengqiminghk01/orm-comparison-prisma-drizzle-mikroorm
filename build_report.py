import json, html, statistics as st
import os; BASE=os.path.dirname(os.path.abspath(__file__))
R=BASE+'/raw/'
agg=json.load(open(R+'09-bench-aggregate.json'))
cs={}
for l in open(R+'12-coldstart.jsonl'):
    d=json.loads(l); cs.setdefault(d['orm'],[]).append(d)
O=['prisma','drizzle','mikro']; NAME={'prisma':'Prisma 7.10','drizzle':'Drizzle 0.45.4','mikro':'MikroORM 7.2.5'}
COL={'prisma':'#5a67d8','drizzle':'#38a169','mikro':'#dd6b20'}
def g(o,k,m='p50'): return agg[o][f'{k}.{m}']
def bar(title, vals, unit, lower_better=True, fmt='{:.2f}'):
    w=560; bh=26; pad=150; mx=max(v for _,v,_ in vals)*1.15 or 1
    h=len(vals)*(bh+10)+40
    s=[f'<svg viewBox="0 0 {w} {h}" width="100%" style="max-width:{w}px"><text x="0" y="16" font-size="13" font-weight="600">{html.escape(title)} <tspan font-weight="400" fill="#666">({unit}，{"越低越好" if lower_better else "越高越好"})</tspan></text>']
    for i,(o,v,rng) in enumerate(vals):
        y=30+i*(bh+10); bw=(w-pad-90)*v/mx
        s.append(f'<text x="0" y="{y+18}" font-size="12">{NAME[o]}</text><rect x="{pad}" y="{y}" width="{bw:.1f}" height="{bh}" fill="{COL[o]}" rx="3"/>')
        s.append(f'<text x="{pad+bw+6:.1f}" y="{y+18}" font-size="12">{fmt.format(v)}{(" ["+rng+"]") if rng else ""}</text>')
    s.append('</svg>'); return ''.join(s)
def b(k,m='p50',unit='ms',lb=True,fmt='{:.2f}'):
    return bar(f'{k} {m}', [(o,g(o,k,m)['mean'],f"{min(g(o,k,m)['runs']):.2f}–{max(g(o,k,m)['runs']):.2f}") for o in O], unit, lb, fmt)
def row(k,label):
    c=[f'<td>{label}</td>']
    for o in O:
        p50=g(o,k,'p50'); p95=g(o,k,'p95'); ops=g(o,k,'opsPerSec')
        c.append(f'<td>{p50["mean"]:.3f}<br><small>{min(p50["runs"]):.3f}–{max(p50["runs"]):.3f}</small></td><td>{p95["mean"]:.3f}</td><td>{ops["mean"]:.0f}</td>')
    return '<tr>'+''.join(c)+'</tr>'
benchrows=''.join(row(k,l) for k,l in [
 ('page_seq','cursor 分页（20 条，replica，串行 3000 次）'),
 ('page_conc10','cursor 分页（10 并发，5000 次）'),
 ('byid_seq','按主键查 1 条（5000 次）— 最能体现 ORM 自身开销'),
 ('insert_seq','单条插入（primary，2000 次）'),
 ('insert_batch500','批量插入 500 行（20 次）'),
 ('reply_tx','事务：检查 parent + 插入 reply（1000 次）'),
 ('upsert_batch1000','批量 upsert 1000 个 accounts（20 次）*'),
 ('stats_groupby','聚合：按 status group by（约 20 万行，30 次）')])
csrow=''
for o in O:
    v=cs[o]; med=lambda f: st.median([f(x) for x in v])
    csrow+=f"<tr><td>{NAME[o]}</td><td>{med(lambda x:x['wallMs']):.0f}（{min(x['wallMs'] for x in v)}–{max(x['wallMs'] for x in v)}）</td><td>{med(lambda x:x['inner']['initMs']):.1f}</td><td>{med(lambda x:x['inner']['firstQueryMs']):.1f}</td><td>{med(lambda x:x['inner']['rssMB']):.0f}</td></tr>"
bundle={l.split()[0]:l for l in open(R+'12-bundle-size.txt')}
def bs(o,key): 
    import re; return int(re.search(key+r'=(\d+)',bundle[o]).group(1))
rss={o:agg[o]['rssMB'] for o in O}
charts=''.join([b('byid_seq'), b('page_seq'), b('insert_seq'), b('reply_tx'),
  bar('冷启动：进程启动 → 第一条查询返回（10 次中位数）',[(o,st.median([x['wallMs'] for x in cs[o]]),'') for o in O],'ms',True,'{:.0f}'),
  bar('esbuild 打包后体积（gzip）',[(o,bs(o,'gzip_bytes')/1024,'') for o in O],'KB',True,'{:.0f}'),
  bar('跑完整个 benchmark 后的 RSS 内存（3 轮平均）',[(o,st.mean(rss[o]),'') for o in O],'MB',True,'{:.0f}')])
eco=open(R+'11-ecosystem.txt').read()
tpl=open(BASE+'/report_template.html').read()
out=tpl.replace('{{BENCHROWS}}',benchrows).replace('{{CHARTS}}',charts).replace('{{CSROWS}}',csrow)
for o in O:
    out=out.replace('{{GZ_'+o+'}}',f"{bs(o,'gzip_bytes')/1024:.0f}").replace('{{RAW_'+o+'}}',f"{bs(o,'bundle_bytes')/1024/1024:.2f}").replace('{{RSS_'+o+'}}',f"{st.mean(rss[o]):.0f}")
# --- TypeScript type-check perf (raw/ts-perf/summary.tsv) ---
TSN={'d045':'Drizzle 0.45.4','d1rc':'Drizzle 1.0.0-rc.4','prisma':'Prisma 7.10.0'}
TSC={'d045':'#38a169','d1rc':'#9ae6b4','prisma':'#5a67d8'}
ts=[l.rstrip('\n').split('\t') for l in open(R+'ts-perf/summary.tsv')][1:]
tsrows=''.join(f"<tr><td>{r[0]}</td><td>{TSN[r[1]]}</td><td>{int(r[2]):,}</td><td>{int(r[3]):,}</td><td>{r[4]}</td><td>{r[5]}（{r[6]}）</td><td>{r[7]}</td><td>{r[8]}</td></tr>" for r in ts)
def tschart():
    w=560; Ns=['10','50','100','200']; V=list(TSN); bh=10; gh=len(V)*bh+14; pad=60
    mx=max(float(r[5]) for r in ts)*1.15; h=40+len(Ns)*gh+30
    s=[f'<svg viewBox="0 0 {w} {h}" width="100%" style="max-width:{w}px"><text x="0" y="16" font-size="13" font-weight="600">tsc Check time <tspan font-weight="400" fill="#666">(s，3 次中位数，越低越好)</tspan></text>']
    for i,n in enumerate(Ns):
        y0=30+i*gh; s.append(f'<text x="0" y="{y0+gh/2:.0f}" font-size="12">{n} 表</text>')
        for j,v in enumerate(V):
            val=float(next(r for r in ts if r[0]==n and r[1]==v)[5]); bw=(w-pad-50)*val/mx; y=y0+j*bh
            s.append(f'<rect x="{pad}" y="{y}" width="{bw:.1f}" height="{bh-2}" fill="{TSC[v]}"/><text x="{pad+bw+4:.1f}" y="{y+8}" font-size="10">{val:.2f}</text>')
    ly=h-12
    for j,v in enumerate(V): s.append(f'<rect x="{pad+j*170}" y="{ly-9}" width="10" height="10" fill="{TSC[v]}"/><text x="{pad+j*170+14}" y="{ly}" font-size="11">{TSN[v]}</text>')
    s.append('</svg>'); return ''.join(s)
out=out.replace('{{TSROWS}}',tsrows).replace('{{TSCHART}}',tschart())
for r in ts: out=out.replace('{{TS_'+r[1]+'_'+r[0]+'}}',r[5])
pc=[float(r[5]) for r in ts if r[1]=='prisma']
out=out.replace('{{TS_prisma_min}}',f'{min(pc):.2f}').replace('{{TS_prisma_max}}',f'{max(pc):.2f}')
out=out.replace('{{TS_MEM_prisma_200}}',next(r[4] for r in ts if r[1]=='prisma' and r[0]=='200'))
out=out.replace('{{TS_GEN_200}}',f"{int(open(R+'ts-perf/N200-prisma-generated-lines.txt').read().split()[0]):,}")
import re as _re; assert not _re.search(r'\{\{',out), _re.findall(r'\{\{\w+\}\}',out)
open(BASE+'/index.html','w').write(out)
print('ok', len(out))
