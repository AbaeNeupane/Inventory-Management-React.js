/**
 * api.js — central HTTP client for the Smart Inventory backend.
 *
 * Usage:
 *   import api from '../api';
 *   const products = await api.get('/products/');
 *   const order    = await api.post('/sales/orders/', { ... });
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1";

// ── Token helpers ──────────────────────────────────────────────────────────

export const auth = {
  getAccess:  () => sessionStorage.getItem("access_token"),
  getRefresh: () => sessionStorage.getItem("refresh_token"),
  setTokens:  (access, refresh) => {
    sessionStorage.setItem("access_token",  access);
    if (refresh) sessionStorage.setItem("refresh_token", refresh);
  },
  clear: () => {
    sessionStorage.removeItem("access_token");
    sessionStorage.removeItem("refresh_token");
    sessionStorage.removeItem("current_user");
  },
  getUser: () => {
    try {
      return JSON.parse(sessionStorage.getItem("current_user") || "null");
    } catch {
      return null;
    }
  },
  setUser: (user) => sessionStorage.setItem("current_user", JSON.stringify(user)),
  isLoggedIn: () => !!sessionStorage.getItem("access_token"),
};

// ── Core fetch wrapper ─────────────────────────────────────────────────────

let isRefreshing   = false;
let refreshWaiters = [];   // queued calls waiting for the new token

async function tryRefresh() {
  const refresh = auth.getRefresh();
  if (!refresh) throw new Error("No refresh token");

  const res  = await fetch(`${BASE_URL}/auth/token/refresh/`, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ refresh }),
  });

  if (!res.ok) {
    auth.clear();
    window.location.href = "/login";
    throw new Error("Session expired. Please log in again.");
  }

  const data = await res.json();
  auth.setTokens(data.access, data.refresh);
  return data.access;
}

async function request(path, options = {}, retry = true) {
  const url     = `${BASE_URL}${path}`;
  const token   = auth.getAccess();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Don't stringify FormData (file uploads)
  const body =
    options.body instanceof FormData
      ? options.body
      : options.body
      ? JSON.stringify(options.body)
      : undefined;

  if (options.body instanceof FormData) {
    delete headers["Content-Type"]; // let browser set multipart boundary
  }

  const res = await fetch(url, { ...options, headers, body });

  // 401 → attempt silent token refresh once
  if (res.status === 401 && retry) {
    if (isRefreshing) {
      // Another call is already refreshing — queue this one
      return new Promise((resolve, reject) => {
        refreshWaiters.push({ resolve, reject, path, options });
      });
    }

    isRefreshing = true;
    try {
      const newToken = await tryRefresh();
      // Flush the queue with the new token
      refreshWaiters.forEach(({ resolve, reject, path: p, options: o }) => {
        request(p, o, false).then(resolve).catch(reject);
      });
      refreshWaiters = [];
      // Retry the original call with the new token
      return request(path, options, false);
    } finally {
      isRefreshing = false;
    }
  }

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Build a readable error message from DRF error responses
    const message = extractError(data) || `HTTP ${res.status}`;
    const err     = new Error(message);
    err.status    = res.status;
    err.data      = data;
    throw err;
  }

  return data;
}

function extractError(data) {
  if (!data) return null;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  // DRF field errors: { field: ["msg"] }
  const first = Object.values(data)[0];
  if (Array.isArray(first)) return first[0];
  return JSON.stringify(data);
}

// ── Public API ─────────────────────────────────────────────────────────────

const api = {
  get:    (path, options = {})       => request(path, { ...options, method: "GET"    }),
  post:   (path, body, options = {}) => request(path, { ...options, method: "POST",   body }),
  patch:  (path, body, options = {}) => request(path, { ...options, method: "PATCH",  body }),
  put:    (path, body, options = {}) => request(path, { ...options, method: "PUT",    body }),
  delete: (path, options = {})       => request(path, { ...options, method: "DELETE" }),

  // Convenience: paginated list → returns { results, count, next, previous }
  list: (path, params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== "")
    ).toString();
    return request(`${path}${qs ? "?" + qs : ""}`, { method: "GET" });
  },
};

export default api;
