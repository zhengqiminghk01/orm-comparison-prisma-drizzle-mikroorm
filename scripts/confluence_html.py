#!/usr/bin/env python3
"""index.html -> Confluence (ADF-HTML) body: confluence/body.html.
usage: confluence_html.py [media.json]   media.json maps filename -> {"id":..., "collection":...}
Without media.json, images are text placeholders. Chart PNGs come from confluence_export.py."""
import os, re, sys, json
from bs4 import BeautifulSoup
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); OUT = os.path.join(BASE, "confluence")
media = json.load(open(sys.argv[1])) if len(sys.argv) > 1 else {}
soup = BeautifulSoup(open(os.path.join(BASE, "index.html"), encoding="utf-8").read(), "html.parser")
body = soup.body; body.find("h1").decompose()
def fig(name, width, alt):
    if name in media:
        m = media[name]
        return BeautifulSoup(f'<figure data-type="media-single" data-layout="center" data-width="{width}" data-width-type="percentage"><div data-type="media" data-media-type="file" data-id="{m["id"]}" data-collection="{m["collection"]}" data-alt="{alt}"></div></figure>', "html.parser")
    return BeautifulSoup(f"<p>[图片：{name}]</p>", "html.parser")
for i, svg in enumerate(body.find_all("svg"), 1):
    alt = svg.find("text").get_text(" ", strip=True).replace('"', "'")
    svg.replace_with(fig(f"chart-{i:02d}.png", 80, alt))
for d in body.find_all("div", class_="charts"): d.unwrap()
for d in body.find_all("div", class_="concl"): d.attrs = {"data-type": "panel-info"}
for d in body.find_all("div", class_="warn"):
    d.attrs = {"data-type": "panel-warning"}
    if not d.find("p"):
        p = soup.new_tag("p"); [p.append(c) for c in list(d.contents)]; d.append(p)
COL = {"good": "#E3FCEF", "mid": "#FFFAE6", "bad": "#FFEBE6"}
for td in body.find_all(["td", "th"]):
    c = (td.get("class") or [None])[0]
    if c in COL: td["data-background"] = COL[c]
for t in body.find_all(True):
    for a in ("class", "style"):
        if t.has_attr(a): del t[a]
for s in body.find_all("small"): s.unwrap()
for t in body.find_all("b"): t.name = "strong"
for t in body.find_all("i"): t.name = "em"
SHOTS = {"2.4 TypeScript": ["10-ts-typecheck-summary"], "3.1 读写分离": ["08-read-write-routing"],
 "3.2 AI agent": ["02-prisma-migrate-reset-blocked", "03-drizzle-push-force-data-loss", "04-mikro-schema-fresh-wipe"],
 "3.3 性能": ["07-cursor-explain"], "4. Migration": ["01-prisma-rename-refusal", "05-drizzle-rename-tty-exit0", "06-enum-backfill"],
 "5. Benchmarks": ["09-bench-summary"]}
for h in body.find_all(["h2", "h3"]):
    for k, names in SHOTS.items():
        if h.get_text().startswith(k):
            det = soup.new_tag("details"); sm = soup.new_tag("summary"); sm.string = "证据截图（原始终端输出，未编辑）"; det.append(sm)
            for n in names:
                det.append(fig(n + ".png", 100, f"{n} 终端输出截图"))
                p = soup.new_tag("p"); p.string = f"{n}.png（对照表见 EVIDENCE.md）"; det.append(p)
            nxt = h.find_next_sibling(["h2", "h3"]); (nxt.insert_before(det) if nxt else body.append(det))
html = "".join(str(c) for c in body.contents).strip()
open(os.path.join(OUT, "body.html"), "w", encoding="utf-8").write(html)
print(len(html), "placeholders:", html.count("[图片："))
