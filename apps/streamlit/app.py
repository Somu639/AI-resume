"""
ResumeAI — Streamlit frontend + backend console.

Frontend: account + AI workflow pages (sidebar).
Backend: system health / Postgres / S3 ops page.
Calls the shared REST API (Vercel) when available.
"""

from __future__ import annotations

import os

import streamlit as st

from services import env_bootstrap  # noqa: F401,E402
from services import sentry_init  # noqa: F401,E402
from services.auth_session import clear_auth, get_user
from services.health import DEFAULT_API_BASE, check_api

st.set_page_config(
    page_title="ResumeAI",
    page_icon="R",
    layout="wide",
    initial_sidebar_state="expanded",
)

st.title("ResumeAI")
st.caption("Streamlit frontend · AI workflows · ops console")

api = os.getenv("API_BASE_URL", DEFAULT_API_BASE)
user = get_user()
api_status = check_api()

with st.sidebar:
    st.header("Session")
    if user:
        st.write(f"Signed in as **{user.get('email') or user.get('name') or 'user'}**")
        if st.button("Sign out"):
            clear_auth()
            st.rerun()
    else:
        st.write("Not signed in")
        st.page_link("pages/0_Account.py", label="Account →", icon=":material/person:")
    st.divider()
    st.write(f"API: `{api}`")
    st.write(f"API health: **{api_status['label']}**")

col1, col2, col3 = st.columns(3)
col1.metric("API", api_status["label"])
col2.metric("Account", "Signed in" if user else "Guest")
col3.metric("Env", os.getenv("APP_ENV", os.getenv("NODE_ENV", "production")))

st.divider()
st.subheader("Frontend")
st.write("Use the sidebar pages for product workflows.")

f1, f2, f3 = st.columns(3)
with f1:
    st.markdown("### Account")
    st.write("Register or sign in against the production API.")
    st.page_link("pages/0_Account.py", label="Open Account", icon=":material/login:")
with f2:
    st.markdown("### JD Analyze")
    st.write("Paste a job description and extract keywords via the API.")
    st.page_link("pages/1_JD_Analyze.py", label="Open JD Analyze", icon=":material/search:")
with f3:
    st.markdown("### Optimize")
    st.write("Optimize a resume JSON against a job description.")
    st.page_link("pages/2_Optimize.py", label="Open Optimize", icon=":material/auto_awesome:")

st.divider()
st.subheader("Backend")
st.write("Ops console for API, Postgres, and S3 health checks.")
st.page_link("pages/3_Backend.py", label="Open Backend console", icon=":material/monitoring:")

if not api_status["ok"]:
    st.warning(
        "API is unreachable from this Streamlit app. "
        "Set `API_BASE_URL` in Streamlit Secrets to "
        "`https://ai-resume-api-tau.vercel.app/api/v1`."
    )
else:
    st.success("Frontend and backend pages are ready. REST API is healthy.")
