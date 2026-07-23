"""Session helpers for Streamlit frontend auth against the REST API."""

from __future__ import annotations

from typing import Any

import requests
import streamlit as st

from services.health import api_base, api_headers


def get_token() -> str | None:
    return st.session_state.get("access_token")


def get_user() -> dict[str, Any] | None:
    return st.session_state.get("user")


def auth_headers() -> dict[str, str]:
    headers = api_headers()
    token = get_token()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def clear_auth() -> None:
    st.session_state.pop("access_token", None)
    st.session_state.pop("refresh_token", None)
    st.session_state.pop("user", None)


def login(email: str, password: str) -> tuple[bool, str]:
    try:
        res = requests.post(
            f"{api_base()}/auth/login",
            headers=api_headers(),
            json={"email": email, "password": password},
            timeout=30,
        )
        data = res.json() if res.content else {}
        if not res.ok:
            return False, data.get("message") or f"Login failed ({res.status_code})"
        payload = data.get("data", data)
        st.session_state["access_token"] = payload.get("accessToken") or payload.get(
            "access_token"
        )
        st.session_state["refresh_token"] = payload.get("refreshToken") or payload.get(
            "refresh_token"
        )
        st.session_state["user"] = payload.get("user")
        if not st.session_state.get("access_token"):
            return False, "Login succeeded but no access token was returned"
        return True, "Signed in"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)


def register(email: str, password: str, name: str) -> tuple[bool, str]:
    try:
        res = requests.post(
            f"{api_base()}/auth/register",
            headers=api_headers(),
            json={"email": email, "password": password, "name": name},
            timeout=30,
        )
        data = res.json() if res.content else {}
        if not res.ok:
            return False, data.get("message") or f"Register failed ({res.status_code})"
        # Prefer auto-login if tokens returned; otherwise ask user to sign in
        payload = data.get("data", data)
        if payload.get("accessToken") or payload.get("access_token"):
            st.session_state["access_token"] = payload.get("accessToken") or payload.get(
                "access_token"
            )
            st.session_state["refresh_token"] = payload.get("refreshToken") or payload.get(
                "refresh_token"
            )
            st.session_state["user"] = payload.get("user")
            return True, "Account created"
        return True, "Account created — sign in to continue"
    except Exception as exc:  # noqa: BLE001
        return False, str(exc)
