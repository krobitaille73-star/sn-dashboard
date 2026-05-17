#!/usr/bin/env python3
"""Convert SN.xlsx to incidents.json for the dashboard.

PII handling
------------
Employee names and email addresses are replaced with stable pseudonyms so
the dashboard can be deployed without exposing real personnel data.
Pseudonymization is deterministic (same input → same ID across runs) so
charts and filters remain consistent.

Path safety
-----------
The destination path is validated against an allowed base directory to
prevent accidental writes outside the project tree.
"""
import sys
import json
import hashlib
import pathlib
import re
import pandas as pd

# ── Path validation ──────────────────────────────────────────────────────────

src = sys.argv[1] if len(sys.argv) > 1 else "SN.xlsx"
dst = sys.argv[2] if len(sys.argv) > 2 else "public/data/incidents.json"

dst_path = pathlib.Path(dst).resolve()
allowed_base = pathlib.Path("public/data").resolve()
if not str(dst_path).startswith(str(allowed_base)):
    sys.exit(f"[ERROR] Refusing to write outside {allowed_base}. Got: {dst_path}")

# ── Column selection ─────────────────────────────────────────────────────────

# Work notes are excluded — not used by the dashboard and inflate the file.
KEEP = [
    "Number", "Opened", "Assigned to", "Opened by", "Updated", "Updated by",
    "Short description", "Reassignment count", "Assignment group",
    "Priority", "State", "Store",
]

df = pd.read_excel(src, sheet_name="Page 1", usecols=KEEP)
df["Opened"] = df["Opened"].astype(str)
df["Updated"] = df["Updated"].astype(str)

# ── NaN → safe defaults ──────────────────────────────────────────────────────
# Python's json.dump writes bare NaN (invalid JSON) for missing values.
# Safari's strict JSON parser rejects this; fill before serialising.

for col in df.columns:
    if df[col].dtype == object:
        df[col] = df[col].fillna("")
    else:
        df[col] = df[col].fillna(0)

# ── PII anonymisation ────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
PHONE_RE = re.compile(r"\b\d[\d\s\-().]{6,}\d\b")


def _uid(value: str) -> str:
    """Return a stable 6-char hex ID for a given string."""
    return hashlib.sha256(value.strip().lower().encode()).hexdigest()[:6]


def anonymize_name(val: str) -> str:
    """Replace a full name with 'Agent <uid>'."""
    if not val:
        return val
    return f"Agent {_uid(val)}"


def redact_text(val: str) -> str:
    """Remove emails and phone numbers from free-text fields."""
    if not val:
        return val
    # Strip BOM/format chars that break Safari's JSON parser
    val = val.lstrip("﻿").strip()
    val = EMAIL_RE.sub("[email]", val)
    val = PHONE_RE.sub("[phone]", val)
    return val


PII_NAME_COLS = ["Assigned to", "Opened by", "Updated by"]
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
print(f"Wrote {len(df)} rows to {dst_path} ({size_mb:.1f} MB)")
print("PII anonymised: names → Agent <id>, emails/phones redacted in free-text fields.")
