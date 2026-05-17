#!/usr/bin/env python3
"""Convert SN.xlsx to incidents.json for the dashboard."""
import sys
import json
import pandas as pd

src = sys.argv[1] if len(sys.argv) > 1 else "SN.xlsx"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/data/incidents.json"

# Work notes are not used by the dashboard and inflate the file to 27 MB
KEEP = ["Number", "Opened", "Assigned to", "Opened by", "Updated", "Updated by",
        "Short description", "Reassignment count", "Assignment group", "Priority", "State", "Store"]

df = pd.read_excel(src, sheet_name="Page 1", usecols=KEEP)
df["Opened"] = df["Opened"].astype(str)
df["Updated"] = df["Updated"].astype(str)

# Fill NaN before dumping — Python's json.dump writes bare NaN by default
# which is not valid JSON and causes Safari's JSON parser to reject the file.
for col in df.columns:
    if df[col].dtype == object:
        df[col] = df[col].fillna("")
    else:
        df[col] = df[col].fillna(0)

with open(dst, "w", encoding="utf-8") as f:
    json.dump(df.to_dict(orient="records"), f, ensure_ascii=True, allow_nan=False)

size_mb = __import__("os").path.getsize(dst) / 1_048_576
print(f"Wrote {len(df)} rows to {dst} ({size_mb:.1f} MB)")
