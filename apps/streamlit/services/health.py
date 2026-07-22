from __future__ import annotations

import os
from typing import Any

import requests


def api_base() -> str:
    return os.getenv("API_BASE_URL", "http://localhost:4000/api/v1").rstrip("/")


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
    s3_ok, s3_msg = check_s3()
    api = check_api()

    return {
        "api": api,
        "database": {"ok": db_ok, "label": "Connected" if db_ok else "Error", "detail": db_msg},
        "storage": {"ok": s3_ok, "label": "Ready" if s3_ok else "Error", "detail": s3_msg},
    }
