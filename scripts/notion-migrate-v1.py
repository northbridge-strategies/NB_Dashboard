"""
Northbridge Dashboard — v1 Schema Migration

Idempotent. Safe to re-run.

Adds:
  - Diagnostic Scores DB:
      "Manual Review Notes" (rich_text)
  - Pipeline DB:
      Convert "Lead" relation from single_property -> dual_property,
      synced inverse on Leads named "Pipeline Entries".
      (Notion preserves existing relation data on type-change.)
  - Leads DB:
      "Priority" (rollup over "Pipeline Entries" -> "Priority", show_original)

Read-only first: queries each DB schema before mutating, only patches what is missing.
"""

import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

TOKEN = "ntn_C410414269913uknY52XnDbP3Fz8mGGsqZQZXWQihvQavm"
API_VERSION = "2022-06-28"
BASE_URL = "https://api.notion.com/v1"

IDS_PATH = Path(__file__).resolve().parent.parent.parent / "nb-notion-ids.json"
IDS = json.loads(IDS_PATH.read_text())

LEADS = IDS["leads"]
SCORES = IDS["diagnostic_scores"]
PIPELINE = IDS["pipeline"]


def api(method: str, endpoint: str, data=None):
    url = f"{BASE_URL}/{endpoint}"
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    req.add_header("Notion-Version", API_VERSION)
    req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.read().decode()[:600]}", file=sys.stderr)
        raise


def get_db(db_id: str):
    return api("GET", f"databases/{db_id}")


def patch_db(db_id: str, properties: dict):
    return api("PATCH", f"databases/{db_id}", {"properties": properties})


def has_property(db: dict, name: str) -> bool:
    return name in db.get("properties", {})


def relation_type(db: dict, prop_name: str) -> str | None:
    prop = db.get("properties", {}).get(prop_name)
    if not prop or prop.get("type") != "relation":
        return None
    return prop["relation"].get("type")


def find_inverse_relation_name(db: dict, target_db_id: str) -> str | None:
    """Find the property on `db` whose relation points at `target_db_id`."""
    target_clean = target_db_id.replace("-", "")
    for name, prop in db.get("properties", {}).items():
        if prop.get("type") != "relation":
            continue
        rel = prop["relation"]
        if rel.get("database_id", "").replace("-", "") == target_clean:
            return name
    return None


def main():
    print("=" * 60)
    print("Northbridge Dashboard — v1 Schema Migration")
    print("=" * 60)

    print("\n[1/3] Diagnostic Scores: ensure 'Manual Review Notes' (rich_text)")
    scores_db = get_db(SCORES)
    if has_property(scores_db, "Manual Review Notes"):
        print("       already present — skipping.")
    else:
        patch_db(SCORES, {"Manual Review Notes": {"rich_text": {}}})
        print("       added.")

    print("\n[2/3] Pipeline: ensure 'Lead' relation is dual_property")
    pipeline_db = get_db(PIPELINE)
    rel_type = relation_type(pipeline_db, "Lead")
    if rel_type == "dual_property":
        print("       already dual_property — skipping.")
    elif rel_type == "single_property":
        patch_db(
            PIPELINE,
            {
                "Lead": {
                    "relation": {
                        "database_id": LEADS,
                        "type": "dual_property",
                        "dual_property": {"synced_property_name": "Pipeline Entries"},
                    }
                }
            },
        )
        print("       converted to dual_property (inverse: 'Pipeline Entries').")
    else:
        print(f"       ERROR: 'Lead' relation type is {rel_type!r} — unexpected.")
        sys.exit(1)

    print("\n[3/3] Leads: ensure 'Priority' rollup over Pipeline.Priority")
    # Reload Leads after the previous patch may have created the inverse relation.
    leads_db = get_db(LEADS)
    if has_property(leads_db, "Priority"):
        print("       already present — skipping.")
    else:
        inverse_name = find_inverse_relation_name(leads_db, PIPELINE)
        if not inverse_name:
            print("       ERROR: no inverse relation on Leads pointing to Pipeline.")
            print("       Available properties:")
            for n, p in leads_db.get("properties", {}).items():
                print(f"         {n}: {p.get('type')}")
            sys.exit(1)
        print(f"       inverse relation found: {inverse_name!r}")
        patch_db(
            LEADS,
            {
                "Priority": {
                    "rollup": {
                        "relation_property_name": inverse_name,
                        "rollup_property_name": "Priority",
                        "function": "show_original",
                    }
                }
            },
        )
        print("       rollup added.")

    print("\nDone. Verifying final state...")
    leads_db = get_db(LEADS)
    scores_db = get_db(SCORES)
    pipeline_db = get_db(PIPELINE)
    checks = [
        ("Diagnostic Scores: 'Manual Review Notes'", has_property(scores_db, "Manual Review Notes")),
        ("Pipeline.Lead is dual_property", relation_type(pipeline_db, "Lead") == "dual_property"),
        ("Leads: 'Priority' rollup", has_property(leads_db, "Priority")),
    ]
    for label, ok in checks:
        print(f"  {'OK ' if ok else 'FAIL'}  {label}")

    if not all(ok for _, ok in checks):
        sys.exit(1)


if __name__ == "__main__":
    main()
