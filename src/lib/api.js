// src/lib/api.js
// Every call to the backend goes through here. The JWT from login is attached
// as an Authorization header on every request — the backend derives the
// tenant from it, so the frontend never needs to know or send a tenant ID.

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("afh_token");
}

function getStoredJSON(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

async function request(path, options = {}) {
  const token = getToken();
  // FormData (used for care plan uploads) must NOT get a manual Content-Type —
  // the browser sets one with the correct multipart boundary itself.
  const isFormData = options.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
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
    localStorage.setItem("afh_user", JSON.stringify(body.user));
    localStorage.setItem("afh_tenant", JSON.stringify(body.tenant));
    return body.user;
  },
  logout() {
    localStorage.removeItem("afh_token");
    localStorage.removeItem("afh_user");
    localStorage.removeItem("afh_tenant");
  },
  isLoggedIn() {
    return !!getToken();
  },
  getUser() {
    return getStoredJSON("afh_user");
  },
  getTenant() {
    return getStoredJSON("afh_tenant");
  },
  // Admin-only: re-issues the JWT scoped to a different AFH business, so
  // every subsequent request (already going through `request()` above)
  // transparently operates on that tenant's data.
  async switchTenant(tenantId) {
    const body = await request("/auth/switch-tenant", {
      method: "POST",
      body: JSON.stringify({ tenantId }),
    });
    localStorage.setItem("afh_token", body.token);
    localStorage.setItem("afh_tenant", JSON.stringify(body.tenant));
    return body.tenant;
  },
};

export const api = {
  residents: {
    list: () => request("/residents"),
    get: (id) => request(`/residents/${id}`),
    create: (body) => request("/residents", { method: "POST", body: JSON.stringify(body) }),
    notes: {
      list: (id) => request(`/residents/${id}/notes`),
      create: (id, content) => request(`/residents/${id}/notes`, { method: "POST", body: JSON.stringify({ content }) }),
    },
  },
  homes: {
    list: () => request("/homes"),
    create: (body) => request("/homes", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/homes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  },
  invoices: {
    list: (residentId) => request(`/invoices${residentId ? `?residentId=${residentId}` : ""}`),
    generate: (body) => request("/invoices/generate", { method: "POST", body: JSON.stringify(body) }),
    pushToQuickBooks: (id) => request(`/invoices/${id}/push-to-quickbooks`, { method: "PATCH" }),
  },
  employees: {
    list: () => request("/employees"),
    create: (body) => request("/employees", { method: "POST", body: JSON.stringify(body) }),
    expiringCredentials: (days = 60) => request(`/employees/credentials/expiring?days=${days}`),
    setPin: (id, pin) => request(`/employees/${id}/pin`, { method: "PATCH", body: JSON.stringify({ pin }) }),
  },
  shifts: {
    week: (employeeId, weekStart) => request(`/shifts/employees/${employeeId}/week?weekStart=${weekStart}`),
    approve: (shiftIds, approvedBy) =>
      request("/shifts/approve", { method: "POST", body: JSON.stringify({ shiftIds, approvedBy }) }),
    open: () => request("/shifts/open"),
    clockIn: (employeeId, shiftType, pin) =>
      request("/shifts/clock-in", { method: "POST", body: JSON.stringify({ employeeId, shiftType, pin }) }),
    clockOut: (shiftId, pin, opts = {}) =>
      request(`/shifts/${shiftId}/clock-out`, { method: "POST", body: JSON.stringify({ pin, ...opts }) }),
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
  tenants: {
    list: () => request("/tenants"),
    create: (name) => request("/tenants", { method: "POST", body: JSON.stringify({ name }) }),
  },
  carePlans: {
    list: (residentId) => request(`/care-plans?residentId=${residentId}`),
    // `document` is an optional File (PDF/PNG/JPEG/WEBP) — e.g. a physician's
    // order or assessment form the AI should ground the plan in.
    generate: (residentId, planDate, { notes, document } = {}) => {
      const form = new FormData();
      form.append("residentId", residentId);
      form.append("planDate", planDate);
      if (notes) form.append("notes", notes);
      if (document) form.append("document", document);
      return request("/care-plans/generate", { method: "POST", body: form });
    },
    // Binary response — bypasses request()'s JSON parsing. Returns a blob URL
    // the caller must revoke (URL.revokeObjectURL) once done with it.
    async openDocument(id) {
      const token = getToken();
      const res = await fetch(`${API_BASE}/care-plans/${id}/document`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Couldn't load document.");
      const blob = await res.blob();
      window.open(URL.createObjectURL(blob), "_blank");
    },
  },
  quickbooks: {
    status: () => request("/quickbooks/status"),
    getConnectUrl: () => request("/quickbooks/connect"),
  },
};
