"""Parse the ZenFlow Master Inventory (pdftotext -layout output) into raw records.

Run from the repo root:  python3 tools/inventory/parse.py
Writes tools/inventory/raw.json: 400 records, exactly as the PDF states them.
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "master-inventory.txt")

PARTS = [
    (r"^Part 1:", "agents"), (r"^Part 2:", "workflows"), (r"^Part 3:", "bots"), (r"^Part 4:", "databases"),
]
SECTION = re.compile(r"^(\d)\.(\d+) (.+?)\s*$")
AGENT_ROW = re.compile(r"^(\d+)\. (.+?)\s{2,}(.+?)\s{2,}(.+?)\s*$")
LIST_ROW = re.compile(r"^\s*(\d+)\.​?\s*(.+?):\s*(.+?)\s*$")


def clean(s):
    return re.sub(r"\s+", " ", s.replace("​", "")).strip()


def parse():
    lines = open(SRC, encoding="utf8").read().splitlines()
    part, section, sec_no, out = None, None, None, []
    for raw in lines:
        line = raw.replace("​", "")
        for pat, name in PARTS:
            if re.match(pat, line):
                part = name
        m = SECTION.match(line)
        if m and part:
            sec_no, section = f"{m.group(1)}.{m.group(2)}", clean(m.group(3))
            continue
        if not part or not section or line.strip().startswith(("Agent Name", "Document End")):
            continue
        if part == "agents":
            m = AGENT_ROW.match(line)
            if m:
                out.append({"category": "agents", "section": section, "sec": sec_no, "n": int(m.group(1)),
                            "name": clean(m.group(2)), "desc": clean(m.group(3)), "prompt": clean(m.group(4))})
            elif out and out[-1]["category"] == "agents" and line.startswith(" " * 20) and line.strip():
                out[-1]["prompt"] = clean(out[-1]["prompt"] + " " + line)
        else:
            m = LIST_ROW.match(line)
            if m:
                out.append({"category": part, "section": section, "sec": sec_no, "n": int(m.group(1)),
                            "name": clean(m.group(2)), "desc": clean(m.group(3))})
            elif out and out[-1]["category"] == part and line.startswith("     ") and line.strip() and not SECTION.match(line.strip()):
                out[-1]["desc"] = clean(out[-1]["desc"] + " " + line)
    return out


if __name__ == "__main__":
    recs = parse()
    counts = {}
    for r in recs:
        counts[r["category"]] = counts.get(r["category"], 0) + 1
    json.dump(recs, open(os.path.join(HERE, "raw.json"), "w"), indent=1, ensure_ascii=False)
    print(counts, "total", len(recs))
