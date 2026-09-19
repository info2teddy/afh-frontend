// src/lib/tenantColor.js
// Each business gets one colour from a small fixed palette, so an admin working
// across several AFHs can tell which one they're in from the strip alone (see
// TenantBar.jsx) and from the confirm dialog on risky actions (TenantConfirm.jsx).
//
// Assigned by position in the list ordered by createdAt — not by hashing the
// id, so two businesses can never collide until there are more than the
// palette holds. No schema change. The catch: deleting an earlier business
// shifts everyone after it by one colour.
//
// Every entry is dark enough to carry white text at >= 4.5:1, and none is the
// brand navy (sidebar) or the terracotta accent (warnings), so a tenant
// colour is never mistaken for a status colour.
const PALETTE = ["#2f6f5e", "#7a4f8f", "#8a5a1f", "#a4384c", "#1f6f78", "#5a6b2a"];
const FALLBACK = "#3d5a80"; // brand-600, until the tenant list has loaded
const CACHE_KEY = "afh_tenant_colors";

// { [tenantId]: hex } for a list returned by GET /tenants.
export function assignTenantColors(tenants) {
  const ordered = [...tenants].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return Object.fromEntries(ordered.map((t, i) => [t.id, PALETTE[i % PALETTE.length]]));
}

// Cached so the strip paints in the right colour on first render instead of
// flashing brand navy while GET /tenants is in flight. localStorage can throw
// or come back empty (private windows, blocked storage) — fall back quietly.
export function saveTenantColors(colors) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(colors));
  } catch {
    /* cache only — the strip still works without it */
  }
}

export function getTenantColor(tenantId) {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}")[tenantId] || FALLBACK;
  } catch {
    return FALLBACK;
  }
}
