#!/usr/bin/env python3
"""Convert SN Excel/Numbers export to incidents.json for the dashboard.

Supported input formats
-----------------------
  .xlsx / .xls  — via pandas + openpyxl
  .numbers      — via numbers-parser  (pip install numbers-parser)

New columns in SN2 (vs SN)
---------------------------
  Resolve time  — ServiceNow SLA business-hours duration in SECONDS
                  (actual time a technician worked on the ticket, not wall-clock)
  Closed        — real close timestamp; null for Resolved-but-not-Closed tickets

PII handling
------------
Names → pseudonymized as "Agent <sha256[:6]>"
Emails & phone numbers → redacted from free-text fields

Path safety
-----------
Destination path validated against public/data/ base directory.
"""
import sys
import json
import hashlib
import pathlib
import re

# ── Path validation ──────────────────────────────────────────────────────────

src = sys.argv[1] if len(sys.argv) > 1 else "SN2.numbers"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/data/incidents.json"

dst_path = pathlib.Path(dst).resolve()
allowed_base = pathlib.Path("public/data").resolve()
if not str(dst_path).startswith(str(allowed_base)):
    sys.exit(f"[ERROR] Refusing to write outside {allowed_base}. Got: {dst_path}")

# ── Read source file ─────────────────────────────────────────────────────────

src_path = pathlib.Path(src)

if src_path.suffix.lower() == ".numbers":
    try:
        from numbers_parser import Document
    except ImportError:
        sys.exit("[ERROR] Install numbers-parser: pip install numbers-parser")

    doc = Document(str(src_path))
    table = doc.sheets[0].tables[0]
    rows = table.rows()
    headers = [cell.value for cell in rows[0]]

    raw_rows = []
    for row in rows[1:]:
        record = {}
        for h, cell in zip(headers, row):
            v = cell.value
            # Convert datetime objects to ISO string
            if hasattr(v, "isoformat"):
                v = v.isoformat(sep=" ", timespec="seconds")
            record[h] = v
        raw_rows.append(record)

    import pandas as pd
    df = pd.DataFrame(raw_rows)

else:
    import pandas as pd
    df = pd.read_excel(str(src_path), sheet_name="Page 1")
    df["Opened"]  = df["Opened"].astype(str)
    df["Updated"] = df["Updated"].astype(str)
    if "Closed" in df.columns:
        df["Closed"] = df["Closed"].astype(str)

# ── Column selection ─────────────────────────────────────────────────────────

KEEP = [
    "Number", "Opened", "Assigned to", "Opened by", "Updated", "Updated by",
    "Short description", "Reassignment count", "Assignment group",
    "Priority", "State", "Store",
    "Resolve time",   # NEW — SLA business-hours seconds (SN2)
    "Closed",         # NEW — real close timestamp (SN2)
]

# Keep only columns that exist in this file
KEEP = [c for c in KEEP if c in df.columns]
df = df[KEEP]

# ── NaN → safe defaults ──────────────────────────────────────────────────────

for col in df.columns:
    if df[col].dtype == object:
        df[col] = df[col].fillna("")
    else:
        df[col] = df[col].fillna(0)

# ── PII anonymisation ────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"\b\d[\d\s\-().]{6,}\d\b")


def _uid(value: str) -> str:
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()[:6]


def anonymize_name(val: str) -> str:
    return f"Agent {_uid(val)}" if val else val


def redact_text(val: str) -> str:
    if not val:
        return val
    val = val.lstrip("﻿").strip()
    val = EMAIL_RE.sub("[email]", val)
    val = PHONE_RE.sub("[phone]", val)
    return val


PII_NAME_COLS  = ["Assigned to", "Opened by", "Updated by"]
FREE_TEXT_COLS = ["Short description"]

for col in PII_NAME_COLS:
    if col in df.columns:
        df[col] = df[col].apply(anonymize_name)

for col in FREE_TEXT_COLS:
    if col in df.columns:
        df[col] = df[col].apply(redact_text)

# ── Serialise ────────────────────────────────────────────────────────────────

with open(dst_path, "w", encoding="utf-8") as f:
    json.dump(df.to_dict(orient="records"), f, ensure_ascii=True, allow_nan=False)

size_mb = dst_path.stat().st_size / 1_048_576
new_cols = [c for c in ["Resolve time", "Closed"] if c in df.columns]
print(f"Wrote {len(df)} rows → {dst_path} ({size_mb:.1f} MB)")
print(f"Columns included: {list(df.columns)}")
if new_cols:
    print(f"New SN2 columns: {new_cols}")
