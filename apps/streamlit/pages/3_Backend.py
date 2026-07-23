"""Backend / ops console — API, Postgres, S3."""

from __future__ import annotations

import os
import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import env_bootstrap  # noqa: E402,F401
from services.db import ping_database  # noqa: E402
from services.health import DEFAULT_API_BASE, system_status  # noqa: E402
from services.s3_client import list_recent_objects  # noqa: E402

st.set_page_config(page_title="Backend · ResumeAI", layout="wide")
st.title("Backend console")
st.caption("Streamlit ops · PostgreSQL · AWS S3 · REST API")

with st.sidebar:
    st.header("Environment")
    st.code(os.getenv("APP_ENV", os.getenv("NODE_ENV", "production")))
    st.write(f"API: `{os.getenv('API_BASE_URL', DEFAULT_API_BASE)}`")
    st.write(f"S3 bucket: `{os.getenv('S3_BUCKET') or '— (optional)'}`")

status = system_status()
cols = st.columns(3)
cols[0].metric("API", status["api"]["label"])
cols[1].metric("PostgreSQL", status["database"]["label"])
cols[2].metric("S3", status["storage"]["label"])

st.divider()
st.subheader("Service health")
st.json(status)

db_ok, db_detail = ping_database()
st.write("**Database ping:**", "OK" if db_ok else "Unavailable", f"— {db_detail}")

st.subheader("Recent S3 objects")
if not os.getenv("S3_BUCKET"):
    st.info("S3 not configured. Set S3_BUCKET (+ AWS credentials) to enable.")
else:
    try:
        objects = list_recent_objects(limit=10)
        if objects:
            st.dataframe(objects, use_container_width=True)
        else:
            st.info("No objects found in bucket.")
    except Exception as exc:  # noqa: BLE001
        st.warning(f"S3 listing failed: {exc}")
