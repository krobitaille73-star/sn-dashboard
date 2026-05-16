#!/usr/bin/env python3
"""Convert SN.xlsx to incidents.json for the dashboard."""
import sys
import json
import pandas as pd

src = sys.argv[1] if len(sys.argv) > 1 else "SN.xlsx"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/data/incidents.json"

df = pd.read_excel(src, sheet_name="Page 1")
df["Opened"] = df["Opened"].astype(str)
df["Updated"] = df["Updated"].astype(str)

with open(dst, "w", encoding="utf-8") as f:
    json.dump(df.to_dict(orient="records"), f, ensure_ascii=False)

print(f"Wrote {len(df)} rows to {dst}")
