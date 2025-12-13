import { getToken, clearAuth } from "./auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

async function parseJsonSafe(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

export async function apiFetch(path, { auth = true, method = "GET", headers, body } = {}) {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

  const h = new Headers(headers || {});
  h.set("Accept", "application/json");

  if (body && !(body instanceof FormData)) {
    h.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getToken();
    if (token) h.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    method,
    headers: h,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  // kalau token invalid / session expired, bersih-bersih dan lempar error
  if (res.status === 401) {
    clearAuth();
  }

  const data = await parseJsonSafe(res);

  if (!res.ok) {
    const message = data?.message || data?.detail || `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}