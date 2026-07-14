const BASE_URL = import.meta.env.VITE_API_URL ?? "";

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

/**
 * Debe llamarse una vez (por ejemplo al montar la app) para que Sanctum
 * emita la cookie XSRF-TOKEN antes de intentar login/register.
 */
export async function primeCsrfCookie() {
  await fetch(`${BASE_URL}/sanctum/csrf-cookie`, { credentials: "include" });
}

async function request(path, { method = "GET", body } = {}) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  const xsrfToken = getCookie("XSRF-TOKEN");
  if (xsrfToken) headers["X-XSRF-TOKEN"] = xsrfToken;

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    credentials: "include", // envía las cookies de sesión (Sanctum SPA)
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw Object.assign(new Error(error.message || "Error de red"), { status: response.status, error });
  }

  return response.status === 204 ? null : response.json();
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  delete: (path) => request(path, { method: "DELETE" }),
};
