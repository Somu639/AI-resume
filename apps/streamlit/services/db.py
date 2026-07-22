from __future__ import annotations

import os
from typing import Tuple

import psycopg2


def ping_database() -> Tuple[bool, str]:
    url = os.getenv("DATABASE_URL", "")
    if not url:
        return False, "DATABASE_URL not set"

    try:
        # psycopg2 expects postgresql:// (strip prisma query params)
        clean = url.split("?")[0]
        conn = psycopg2.connect(clean, connect_timeout=5)
        with conn.cursor() as cur:
            cur.execute("SELECT 1;")
            cur.fetchone()
        conn.close()
        return True, "SELECT 1 ok"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)
