// src/components/TenantBar.jsx
// Admin-only strip above everything, on every page, naming the business the
// admin is currently acting inside — in that business's own colour. Exists
// because CareFit operates payroll, PIN resets and logins *for* clients, so an
// admin switches between AFHs constantly and the realistic mistake is right
// action, wrong business. The old signal was a small name in the top bar at
// ordinary text weight. A manager can only ever be in their own business, so
// they never see this (PageShell renders the plain name for them).
//
// Fixed height (h-9 = 2.25rem): PageShell offsets the sticky sidebar by the
// same amount, so change both together.
import { useEffect, useState } from "react";
import { api, auth } from "../lib/api";
import { assignTenantColors, getTenantColor, saveTenantColors } from "../lib/tenantColor";
import { TenantSwitcher } from "./TenantSwitcher";

export function TenantBar() {
  const tenant = auth.getTenant();
  const [, refreshColor] = useState(0);

  // Colours depend on the whole list (position by createdAt), so fetch it once
  // per session and cache; render from cache immediately in the meantime.
  useEffect(() => {
    api.tenants
      .list()
      .then((list) => {
        saveTenantColors(assignTenantColors(list));
        refreshColor((n) => n + 1);
      })
      .catch(() => {}); // colour is a nicety — the name still shows without it
  }, []);

  return (
    <div
      role="region"
      aria-label="Active business"
      className="sticky top-0 z-20 flex h-9 items-center gap-3 px-4 text-sm text-white"
      style={{ backgroundColor: getTenantColor(tenant?.id) }}
    >
      <span className="min-w-0 truncate">
        Managing <span className="font-semibold">{tenant?.name || "no business selected"}</span>
      </span>
      <span className="flex-1" />
      <span className="hidden text-white/85 sm:inline">Signed in as CareFit admin</span>
      <TenantSwitcher variant="strip" />
    </div>
  );
}
