"""Load apps/streamlit/.env and Streamlit Cloud secrets once."""

from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)

_SECRET_KEYS = (
    "API_BASE_URL",
    "API_KEY",
    "DATABASE_URL",
    "OPENAI_API_KEY",
    "OPENAI_MODEL",
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "S3_BUCKET",
    "S3_ENDPOINT",
    "SENTRY_DSN",
    "APP_ENV",
)


def _apply_streamlit_secrets() -> None:
    try:
        import streamlit as st

        secrets = getattr(st, "secrets", None)
        if not secrets:
            return
        for key in _SECRET_KEYS:
            if os.getenv(key):
                continue
            try:
                value = secrets.get(key)  # type: ignore[attr-defined]
            except Exception:  # noqa: BLE001
                value = None
            if value is not None and str(value).strip():
                os.environ[key] = str(value).strip()
    except Exception:  # noqa: BLE001
        return


_apply_streamlit_secrets()
