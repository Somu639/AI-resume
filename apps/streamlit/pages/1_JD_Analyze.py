from __future__ import annotations

import json
import sys
from pathlib import Path

import requests
import streamlit as st

# Multipage scripts may not have apps/streamlit on sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.health import api_base, api_headers  # noqa: E402

st.set_page_config(page_title="JD Analyze · ResumeAI", layout="wide")
st.title("Job description analysis")

api = api_base()
headers = api_headers()

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
