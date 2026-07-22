from __future__ import annotations

import json
import os

import requests
import streamlit as st

st.set_page_config(page_title="JD Analyze · ResumeAI", layout="wide")
st.title("Job description analysis")

api = os.getenv("API_BASE_URL", "http://localhost:4000/api/v1").rstrip("/")
headers = {"Content-Type": "application/json"}
if os.getenv("API_KEY"):
    headers["X-API-Key"] = os.getenv("API_KEY", "")

jd = st.text_area("Paste job description", height=240)

if st.button("Analyze", type="primary", disabled=len(jd.strip()) < 40):
    with st.spinner("Calling API…"):
        try:
            res = requests.post(
                f"{api}/job-descriptions/analyze",
                headers=headers,
                json={"jobDescription": jd},
                timeout=90,
            )
            res.raise_for_status()
            st.json(res.json())
        except Exception as exc:  # noqa: BLE001
            st.error(str(exc))
            st.code(json.dumps({"api": api}, indent=2))
