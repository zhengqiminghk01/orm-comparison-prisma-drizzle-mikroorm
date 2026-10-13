#!/usr/bin/env python3
"""Summarize raw/ts-perf/*.txt -> raw/ts-perf/summary.txt + summary.tsv (median of 3 runs)."""
import re, statistics as st, os
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "raw", "ts-perf")
def p(f):
    s = open(os.path.join(D, f)).read(); g = lambda k: float(re.search(rf"^{k}:\s+([\d.]+)", s, re.M).group(1))
    return dict(types=g("Types"), inst=g("Instantiations"), mem=g("Memory used") / 1024, check=g("Check time"), total=g("Total time"))
out = ["N\tvariant\tTypes\tInstantiations\tMemoryMB(med)\tCheck s(med)\tCheck min-max\tTotal s(med)\tincr edit Check s\tincr edit Total s"]
for N in (10, 50, 100, 200):
    for v in ("d045", "d1rc", "prisma"):
        r = [p(f"N{N}-{v}-run{k}.txt") for k in (1, 2, 3)]; c = [x["check"] for x in r]
        e = open(os.path.join(D, f"N{N}-{v}-incr.txt")).read().split("### after")[1]
        ec = re.search(r"Check time:\s+([\d.]+)", e).group(1); et = re.search(r"Total time:\s+([\d.]+)", e).group(1)
        out.append(f"{N}\t{v}\t{int(r[0]['types'])}\t{int(r[0]['inst'])}\t{st.median(x['mem'] for x in r):.0f}\t{st.median(c):.2f}\t{min(c):.2f}-{max(c):.2f}\t{st.median(x['total'] for x in r):.2f}\t{ec}\t{et}")
open(os.path.join(D, "summary.tsv"), "w").write("\n".join(out) + "\n")
rows = [l.split("\t") for l in out]; wd = [max(len(r[i]) for r in rows) for i in range(len(rows[0]))]
txt = "\n".join("  ".join(c.rjust(wd[i]) if i != 1 else c.ljust(wd[i]) for i, c in enumerate(r)) for r in rows)
open(os.path.join(D, "summary.txt"), "w").write(txt + "\n"); print(txt)
