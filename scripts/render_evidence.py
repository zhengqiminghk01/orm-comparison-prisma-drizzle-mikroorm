"""Render line ranges of raw/ logs to terminal-style PNGs (AI agent product names masked; see MASK).
Only ANSI control sequences and carriage returns are stripped; text is otherwise unchanged.
Usage: python3 scripts/render_evidence.py   (run from repo root)"""
import os, re
from PIL import Image, ImageDraw, ImageFont
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "evidence", "screenshots")
FONT = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", 14)
ANSI = re.compile(r"\x1b\[[0-9;?]*[A-Za-z]")
WRAP = 150
# Masked in rendered images only; raw logs keep the original text.
MASK = [("CLAUDECODE=1", "<AI agent env>=1"), ("Claude Code", "<AI agent>")]
SHOTS = [
 ("01-prisma-rename-refusal", [("raw/03-prisma-migrations.log", 100, 116)]),
 ("02-prisma-migrate-reset-blocked", [("raw/05-ai-guardrail.log", 1, 8), ("raw/05-ai-guardrail.log", 22, 29), ("raw/05-ai-guardrail.log", 44, 45)]),
 ("03-drizzle-push-force-data-loss", [("raw/05-ai-guardrail.log", 52, 60)]),
 ("04-mikro-schema-fresh-wipe", [("raw/05-ai-guardrail.log", 47, 50)]),
 ("05-drizzle-rename-tty-exit0", [("raw/03-drizzle-migrations.log", 56, 59), ("raw/03-drizzle-migrations.log", 68, 68)]),
 ("06-enum-backfill", [("raw/03-prisma-migrations.log", 164, 164), ("raw/03-prisma-migrations.log", 181, 181),
                       ("raw/03-drizzle-migrations.log", 140, 148), ("raw/03-mikro-migrations.log", 271, 272),
                       ("raw/03-mikro-migrations.log", 326, 326), ("raw/03-mikro-migrations.log", 355, 361)]),
 ("07-cursor-explain", [("raw/10-explain.txt", 1, 14), ("raw/10-explain.txt", 17, 30), ("raw/10-explain.txt", 33, 46)]),
 ("08-read-write-routing", [("raw/08-routing-summary.txt", 1, 13)]),
 ("09-bench-summary", [("raw/09-bench-summary.txt", 1, 38)]),
 ("10-ts-typecheck-summary", [("raw/ts-perf/summary.txt", 1, 13), ("raw/ts-perf/N200-d045-run1.txt", 1, 28)]),
]
def lines_of(path, a, b):
    L = open(os.path.join(ROOT, path), encoding="utf-8", errors="replace").read().split("\n")
    out = []
    for i in range(a, b + 1):
        s = ANSI.sub("", L[i - 1]).replace("\r", "")
        for a, b in MASK: s = s.replace(a, b)
        chunks = [s[k:k + WRAP] for k in range(0, max(len(s), 1), WRAP)]
        out.append((f"{i:>4} ", chunks[0])); out += [("     ", c) for c in chunks[1:]]
    return out
os.makedirs(OUT, exist_ok=True)
for name, ranges in SHOTS:
    rows = []
    for (p, a, b) in ranges:
        rows.append(("$ ", f"sed -n '{a},{b}p' {p}   # line numbers shown on the left"))
        rows += lines_of(p, a, b)
    lh = 19; w = 9 * (WRAP + 8) + 40; h = lh * len(rows) + 50
    im = Image.new("RGB", (w, h), (24, 26, 33)); d = ImageDraw.Draw(im)
    d.text((20, 10), f"{name}  (excerpt; ANSI codes stripped; agent names masked)", font=FONT, fill=(150, 160, 180))
    y = 36
    for pre, txt in rows:
        cmd = pre == "$ "
        d.text((20, y), pre, font=FONT, fill=(120, 200, 120) if cmd else (100, 110, 130))
        d.text((20 + 9 * 5, y), txt, font=FONT, fill=(120, 200, 120) if cmd else (225, 228, 235))
        y += lh
    im.save(os.path.join(OUT, name + ".png")); print(name, im.size)
