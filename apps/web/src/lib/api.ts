/**
 * Browser calls same-origin `/api/v1` (Next.js rewrites → Express).
 * Override with NEXT_PUBLIC_API_URL only when you need a direct API host.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function authHeaders(extra?: HeadersInit): HeadersInit {
  const token = getAccessToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type") && !(init?.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  const token = getAccessToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { message?: string }).message ?? `Request failed: ${res.status}`
    );
  }

  return res.json() as Promise<T>;
}

/** Multipart upload helper (do not set Content-Type — browser sets boundary). */
export async function apiUpload<T>(
  path: string,
  formData: FormData,
  init?: Omit<RequestInit, "body" | "method">
): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    method: "POST",
    body: formData,
    headers: authHeaders(init?.headers),
  });
}
