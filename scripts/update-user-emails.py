"""
One-off: rename emails on the Dashboard Users DB.
"""
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

TOKEN = "ntn_C410414269913uknY52XnDbP3Fz8mGGsqZQZXWQihvQavm"
API_VERSION = "2022-06-28"
BASE_URL = "https://api.notion.com/v1"

ids = json.loads((Path(__file__).resolve().parent.parent.parent / "nb-notion-ids.json").read_text())
USERS_DB = ids["dashboard_users"]

RENAMES = [
    ("doug@northbridgestrategies.com",   "droyal@northbridgestrategies.org"),
    ("hashir@northbridgestrategies.com", "azamhashir99@gmail.com"),
]


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


def find(email):
    res = api("POST", f"databases/{USERS_DB}/query", {
        "filter": {"property": "Email", "title": {"equals": email}},
        "page_size": 1,
    })
    results = res.get("results", [])
    return results[0] if results else None


for old, new in RENAMES:
    page = find(old)
    if not page:
        print(f"  not found: {old} (already renamed?)")
        continue
    api("PATCH", f"pages/{page['id']}", {
        "properties": {
            "Email": {"title": [{"type": "text", "text": {"content": new}}]},
        }
    })
    print(f"  {old} -> {new}")

print("\nDone.")
