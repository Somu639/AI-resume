"""Load apps/streamlit/.env once for app + multipage scripts."""

from __future__ import annotations

from pathlib import Path

from dotenv import load_dotenv

_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(_ENV_PATH)
