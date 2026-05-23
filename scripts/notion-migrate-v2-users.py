"""
Northbridge Dashboard — v2 Schema Migration: Users DB

Creates a "Dashboard Users" database under the same Northbridge parent page,
then seeds it from config/users.json.

Idempotent:
  - If a DB titled "Dashboard Users" already exists under the parent, reuses it.
  - For each seed user, upserts by Email (creates if missing, updates name/role
    only — never overwrites an existing password hash).

Output: writes the new database id to nb-notion-ids.json so other tooling can
discover it. The dashboard reads it from NOTION_USERS_DB env var.
"""

import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

TOKEN = "ntn_C410414269913uknY52XnDbP3Fz8mGGsqZQZXWQihvQavm"
API_VERSION = "2022-06-28"
BASE_URL = "https://api.notion.com/v1"

REPO_ROOT = Path(__file__).resolve().parent.parent
DASHBOARD_ROOT = REPO_ROOT
IDS_PATH = REPO_ROOT.parent / "nb-notion-ids.json"
USERS_JSON_PATH = DASHBOARD_ROOT / "config" / "users.json"

ids = json.loads(IDS_PATH.read_text())
PARENT_PAGE_ID = ids["parent_page"]


def api(method, endpoint, data=None):
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


def find_users_db():
    """Search for an existing 'Dashboard Users' DB under the parent page."""
    cursor = None
    while True:
        body = {
            "query": "Dashboard Users",
            "filter": {"value": "database", "property": "object"},
            "page_size": 100,
        }
        if cursor:
            body["start_cursor"] = cursor
        res = api("POST", "search", body)
        for r in res.get("results", []):
            if r.get("object") != "database":
                continue
            title_parts = r.get("title", [])
            title = "".join(t.get("plain_text", "") for t in title_parts)
            parent = r.get("parent", {})
            parent_id = parent.get("page_id", "").replace("-", "")
            if title.strip() == "Dashboard Users" and parent_id == PARENT_PAGE_ID.replace("-", ""):
                return r["id"]
        if not res.get("has_more"):
            return None
        cursor = res.get("next_cursor")


def create_users_db():
    data = {
        "parent": {"type": "page_id", "page_id": PARENT_PAGE_ID},
        "title": [{"type": "text", "text": {"content": "Dashboard Users"}}],
        "description": [
            {"type": "text", "text": {
                "content": "Operations Dashboard auth users. Managed via the dashboard's /profile page."
            }}
        ],
        "properties": {
            "Email": {"title": {}},                               # title (required, used as primary key)
            "Name": {"rich_text": {}},
            "Role": {
                "select": {
                    "options": [
                        {"name": "Admin", "color": "purple"},
                        {"name": "Staff", "color": "blue"},
                        {"name": "Client", "color": "green"},
                    ]
                }
            },
            "Password Hash": {"rich_text": {}},
            "Avatar URL": {"url": {}},
            "Active": {"checkbox": {}},
            "Created": {"created_time": {}},
            "Last Sign-In": {"date": {}},
        },
    }
    res = api("POST", "databases", data)
    return res["id"]


def find_user_by_email(db_id, email):
    res = api("POST", f"databases/{db_id}/query", {
        "filter": {"property": "Email", "title": {"equals": email}},
        "page_size": 1,
    })
    results = res.get("results", [])
    return results[0] if results else None


def upsert_user(db_id, user):
    email = user["email"].lower().strip()
    existing = find_user_by_email(db_id, email)

    if existing:
        # Update name + role + active. NEVER overwrite password hash from JSON
        # if it already exists in Notion (Notion is the source of truth now).
        props = {
            "Name": {"rich_text": [{"type": "text", "text": {"content": user["name"]}}]},
            "Role": {"select": {"name": user["role"]}},
            "Active": {"checkbox": True},
        }
        api("PATCH", f"pages/{existing['id']}", {"properties": props})
        print(f"  updated  {email}")
        return existing["id"]

    # Create new
    props = {
        "Email": {"title": [{"type": "text", "text": {"content": email}}]},
        "Name": {"rich_text": [{"type": "text", "text": {"content": user["name"]}}]},
        "Role": {"select": {"name": user["role"]}},
        "Password Hash": {
            "rich_text": [{"type": "text", "text": {"content": user["passwordHash"]}}]
        },
        "Active": {"checkbox": True},
    }
    res = api("POST", "pages", {
        "parent": {"database_id": db_id},
        "properties": props,
    })
    print(f"  created  {email}")
    return res["id"]


def main():
    print("=" * 60)
    print("Northbridge Dashboard — v2 Migration: Users DB")
    print("=" * 60)

    print("\n[1/3] Locate or create 'Dashboard Users' database...")
    db_id = find_users_db()
    if db_id:
        print(f"  found existing: {db_id}")
    else:
        db_id = create_users_db()
        print(f"  created: {db_id}")

    print("\n[2/3] Seed users from config/users.json...")
    seed_users = json.loads(USERS_JSON_PATH.read_text())
    for u in seed_users:
        upsert_user(db_id, u)

    print("\n[3/3] Persist new database id...")
    ids["dashboard_users"] = db_id
    IDS_PATH.write_text(json.dumps(ids, indent=2))
    print(f"  wrote {IDS_PATH}")

    print("\nDone.")
    print(f"\nNext step: add NOTION_USERS_DB={db_id} to .env.local and Vercel env.")


if __name__ == "__main__":
    main()
