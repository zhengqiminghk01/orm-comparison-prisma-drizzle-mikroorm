#!/usr/bin/env python3
"""index.html -> Confluence storage format (confluence/storage.xhtml) + chart PNGs (confluence/charts/).
Charts: each inline <svg> is rendered to PNG with cairosvg. Evidence screenshots are referenced as attachments."""
import os, re, cairosvg
from bs4 import BeautifulSoup
BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(BASE, "confluence"); os.makedirs(os.path.join(OUT, "charts"), exist_ok=True)
soup = BeautifulSoup(open(os.path.join(BASE, "index.html"), encoding="utf-8").read(), "html.parser")
body = soup.body
body.find("h1").decompose()  # title becomes the page title
def img(name, width=None):
    t = soup.new_tag("ac:image"); 
    if width: t["ac:width"] = str(width)
    a = soup.new_tag("ri:attachment"); a["ri:filename"] = name; t.append(a); return t
def macro(name, inner):
    m = soup.new_tag("ac:structured-macro"); m["ac:name"] = name
    rb = soup.new_tag("ac:rich-text-body"); [rb.append(c) for c in list(inner.contents)]; m.append(rb); return m
# charts
charts = []
for i, svg in enumerate(body.find_all("svg"), 1):
    s = str(svg).replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" font-family="Noto Sans CJK SC, Noto Serif CJK SC, sans-serif" ', 1)
    s = re.sub(r'^(<svg[^>]*?) (?:width="100%"|style="[^"]*")', r"\1", re.sub(r'^(<svg[^>]*?) (?:width="100%"|style="[^"]*")', r"\1", s)).replace("viewbox=", "viewBox=")
    vw, vh = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', s).groups()
    s = s.replace("<svg ", f'<svg width="{vw}" height="{vh}" ', 1)
    title = svg.find("text").get_text(" ", strip=True)
    fn = f"chart-{i:02d}.png"; cairosvg.svg2png(bytestring=s.encode(), write_to=os.path.join(OUT, "charts", fn), output_width=1120, background_color="white")
    charts.append((fn, title)); p = soup.new_tag("p"); p.append(img(fn, 560)); svg.replace_with(p)
for d in body.find_all("div", class_="charts"): d.unwrap()
for d in body.find_all("div", class_="concl"): d.replace_with(macro("info", d))
for d in body.find_all("div", class_="warn"): d.replace_with(macro("warning", d))
COL = {"good": "#e3fcef", "mid": "#fffae6", "bad": "#ffebe6"}
for td in body.find_all(["td", "th"]):
    c = (td.get("class") or [None])[0]
    if c in COL: td["data-highlight-colour"] = COL[c]
    if td.has_attr("class"): del td["class"]
for t in body.find_all(True):
    for a in ("style", "class"):
        if t.has_attr(a) and not t.name.startswith("ac:"): del t[a]
# evidence screenshots, inline after the relevant heading
SHOTS = {
 "2.4 TypeScript": ["10-ts-typecheck-summary"],
 "3.1 读写分离": ["08-read-write-routing"],
 "3.2 AI agent": ["02-prisma-migrate-reset-blocked", "03-drizzle-push-force-data-loss", "04-mikro-schema-fresh-wipe"],
 "3.3 性能": ["07-cursor-explain"],
 "4. Migration": ["01-prisma-rename-refusal", "05-drizzle-rename-tty-exit0", "06-enum-backfill"],
 "5. Benchmarks": ["09-bench-summary"],
}
for h in body.find_all(["h2", "h3"]):
    for k, names in SHOTS.items():
        if h.get_text().startswith(k):
            anchor = h
            # place at end of the section (before next h2/h3)
            nxt = h.find_next_sibling(["h2", "h3"])
            ex = soup.new_tag("ac:structured-macro"); ex["ac:name"] = "expand"
            pr = soup.new_tag("ac:parameter"); pr["ac:name"] = "title"; pr.string = "证据截图（原始终端输出，未编辑）"; ex.append(pr)
            rb = soup.new_tag("ac:rich-text-body")
            for n in names:
                p = soup.new_tag("p"); p.append(img(n + ".png", 900)); rb.append(p)
                c = soup.new_tag("p"); c.string = f"{n}.png（来源：EVIDENCE.md）"; rb.append(c)
            ex.append(rb)
            (nxt.insert_before(ex) if nxt else body.append(ex))
html = "".join(str(c) for c in body.contents)
html = re.sub(r"<(br|hr|img)([^>]*?)\s*/?>", r"<\1\2/>", html)
html = re.sub(r"<(ri:attachment[^>]*?)\s*/?>(</ri:attachment>)?", r"<\1/>", html)
open(os.path.join(OUT, "storage.xhtml"), "w", encoding="utf-8").write(html.strip())
print("charts:", charts)
