from __future__ import annotations

import os
from typing import Any

import requests

from services import env_bootstrap  # noqa: F401

# Production API on Vercel. Override with API_BASE_URL for local dev
# (e.g. http://localhost:4002/api/v1) or Docker Compose.
DEFAULT_API_BASE = "https://ai-resume-api-tau.vercel.app/api/v1"


def api_base() -> str:
    return os.getenv("API_BASE_URL", DEFAULT_API_BASE).rstrip("/")


def api_headers() -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    api_key = os.getenv("API_KEY", "")
    if api_key:
        headers["X-API-Key"] = api_key
    return headers


def check_api() -> dict[str, Any]:
    try:
        res = requests.get(f"{api_base()}/health", timeout=5)
        ok = res.ok
        return {
            "ok": ok,
            "label": "Healthy" if ok else f"HTTP {res.status_code}",
            "body": res.json() if ok else {"error": res.text[:200]},
        }
    except Exception as exc:  # noqa: BLE001
        return {"ok": False, "label": "Down", "error": str(exc)}


def system_status() -> dict[str, Any]:
    from services.db import ping_database
    from services.s3_client import check_s3

    db_ok, db_msg = ping_database()
    s3_ok, s3_msg, s3_optional = check_s3()
    api = check_api()

    if s3_optional and not s3_ok:
        storage = {"ok": True, "label": "Skipped", "detail": s3_msg}
    else:
        storage = {
            "ok": s3_ok,
            "label": "Ready" if s3_ok else "Error",
            "detail": s3_msg,
        }

    return {
        "api": api,
        "database": {
            "ok": db_ok,
            "label": "Connected" if db_ok else "Error",
            "detail": db_msg,
        },
        "storage": storage,
    }
