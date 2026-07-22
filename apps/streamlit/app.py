"""
ResumeAI Streamlit Backend
Production AI operations console + backend workflows.
Connects to PostgreSQL and AWS S3; calls the REST API when available.
"""

from __future__ import annotations

import os

import streamlit as st
from dotenv import load_dotenv

load_dotenv()

from services import sentry_init  # noqa: F401,E402
from services.health import system_status
from services.s3_client import list_recent_objects
from services.db import ping_database

st.set_page_config(
    page_title="ResumeAI Backend",
    page_icon="R",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("ResumeAI Backend")
st.caption("Streamlit operations console · PostgreSQL · AWS S3 · OpenAI")

with st.sidebar:
    st.header("Environment")
    st.code(os.getenv("NODE_ENV", os.getenv("APP_ENV", "development")))
    st.write(f"API: `{os.getenv('API_BASE_URL', 'http://localhost:4000/api/v1')}`")
    st.write(f"S3 bucket: `{os.getenv('S3_BUCKET', '—')}`")

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
try:
    objects = list_recent_objects(limit=10)
    if objects:
        st.dataframe(objects, use_container_width=True)
    else:
        st.info("No objects found (or S3 not configured).")
except Exception as exc:  # noqa: BLE001
    st.warning(f"S3 listing failed: {exc}")

st.success("Streamlit backend is running. Use the pages in the sidebar for AI workflows.")
