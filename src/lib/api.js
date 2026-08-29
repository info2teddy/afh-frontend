// src/lib/api.js
// Every call to the backend goes through here. The JWT from login is attached
// as an Authorization header on every request — the backend derives the
// tenant from it, so the frontend never needs to know or send a tenant ID.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("afh_token");
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("afh_token");
    window.location.href = "/login";
    throw new Error("Session expired — please log in again.");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const auth = {
  async login(email, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Login failed.");
    localStorage.setItem("afh_token", body.token);
    return body.user;
  },
  logout() {
    localStorage.removeItem("afh_token");
  },
  isLoggedIn() {
    return !!getToken();
  },
};

export const api = {
  residents: {
    list: () => request("/residents"),
    get: (id) => request(`/residents/${id}`),
  },
  invoices: {
    list: (residentId) => request(`/invoices${residentId ? `?residentId=${residentId}` : ""}`),
    generate: (body) => request("/invoices/generate", { method: "POST", body: JSON.stringify(body) }),
    pushToQuickBooks: (id) => request(`/invoices/${id}/push-to-quickbooks`, { method: "PATCH" }),
  },
  employees: {
    list: () => request("/employees"),
    expiringCredentials: (days = 60) => request(`/employees/credentials/expiring?days=${days}`),
  },
  shifts: {
    week: (employeeId, weekStart) => request(`/shifts/employees/${employeeId}/week?weekStart=${weekStart}`),
    approve: (shiftIds, approvedBy) =>
      request("/shifts/approve", { method: "POST", body: JSON.stringify({ shiftIds, approvedBy }) }),
  },
  payroll: {
    createRun: (body) => request("/payroll/runs", { method: "POST", body: JSON.stringify(body) }),
    submitRun: (id) => request(`/payroll/runs/${id}/submit`, { method: "PATCH" }),
  },
  onboarding: {
    checklist: (employeeId) => request(`/onboarding/employees/${employeeId}`),
    instantiate: (employeeId) => request(`/onboarding/employees/${employeeId}/instantiate`, { method: "POST" }),
    addConditional: (employeeId, templateName) =>
      request(`/onboarding/employees/${employeeId}/add-conditional`, {
        method: "POST",
        body: JSON.stringify({ templateName }),
      }),
    complete: (itemId) => request(`/onboarding/${itemId}/complete`, { method: "PATCH" }),
  },
};
