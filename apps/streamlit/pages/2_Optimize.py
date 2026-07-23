from __future__ import annotations

import json
import sys
from pathlib import Path

import requests
import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services.auth_session import auth_headers  # noqa: E402
from services.health import api_base  # noqa: E402

st.set_page_config(page_title="Optimize · ResumeAI", layout="wide")
st.title("Resume optimization")

api = api_base()
headers = auth_headers()

col1, col2 = st.columns(2)
with col1:
    resume_raw = st.text_area("Resume JSON", height=360, placeholder='{"personalInfo":{...}}')
with col2:
    job_raw = st.text_area("Job description JSON", height=360, placeholder='{"requiredSkills":[]}')

if st.button("Optimize", type="primary"):
    try:
        payload = {
            "resume": json.loads(resume_raw),
            "jobDescription": json.loads(job_raw),
        }
    except json.JSONDecodeError as exc:
        st.error(f"Invalid JSON: {exc}")
        st.stop()

    with st.spinner("Optimizing via API…"):
        try:
            res = requests.post(
                f"{api}/optimize",
                headers=headers,
                json=payload,
                timeout=180,
            )
            res.raise_for_status()
            data = res.json().get("data", res.json())
            st.subheader("ATS scores")
            st.write(
                {
                    "before": data.get("beforeAtsScore"),
                    "after": data.get("afterAtsScore"),
                    "improvement": data.get("atsImprovementScore"),
                }
            )
            st.subheader("Missing keywords")
            st.write(data.get("missingKeywords", []))
            st.subheader("Cover letter")
            st.write(data.get("coverLetter", {}))
            st.subheader("Optimized resume")
            st.json(data.get("optimizedResume", {}))
        except Exception as exc:  # noqa: BLE001
            st.error(str(exc))
