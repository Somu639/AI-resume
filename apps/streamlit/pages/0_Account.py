from __future__ import annotations

import sys
from pathlib import Path

import streamlit as st

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from services import env_bootstrap  # noqa: E402,F401
from services.auth_session import clear_auth, get_user, login, register  # noqa: E402

st.set_page_config(page_title="Account · ResumeAI", layout="centered")
st.title("Account")

user = get_user()
if user:
    st.success(f"Signed in as {user.get('email') or user.get('name')}")
    st.json(user)
    if st.button("Sign out"):
        clear_auth()
        st.rerun()
    st.stop()

tab_login, tab_register = st.tabs(["Sign in", "Register"])

with tab_login:
    email = st.text_input("Email", key="login_email")
    password = st.text_input("Password", type="password", key="login_password")
    if st.button("Sign in", type="primary", key="login_btn"):
        ok, msg = login(email.strip(), password)
        if ok:
            st.success(msg)
            st.rerun()
        else:
            st.error(msg)

with tab_register:
    name = st.text_input("Name", key="reg_name")
    email_r = st.text_input("Email", key="reg_email")
    password_r = st.text_input("Password", type="password", key="reg_password")
    if st.button("Create account", type="primary", key="reg_btn"):
        if len(password_r) < 8:
            st.error("Password must be at least 8 characters")
        else:
            ok, msg = register(email_r.strip(), password_r, name.strip() or "User")
            if ok:
                st.success(msg)
                st.rerun()
            else:
                st.error(msg)
