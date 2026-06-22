const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

function buildUrl(endpoint) {
  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem("user_token");
  const { method = "GET", body, headers = {} } = options;

  const isFormData = body instanceof FormData;
  const requestHeaders = {
    Accept: "application/json",
    ...headers,
  };

  if (isFormData) {
    delete requestHeaders["Content-Type"];
  }

  if (token) {
    requestHeaders.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(buildUrl(endpoint), {
    method,
    headers: requestHeaders,
    body: body !== undefined ? (isFormData ? body : JSON.stringify(body)) : undefined,
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  if (!response.ok) {
    const error = new Error(payload?.message || "Request failed");
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}
