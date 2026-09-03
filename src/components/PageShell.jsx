// src/components/PageShell.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { TenantSwitcher } from "./TenantSwitcher";

const NAV_ITEMS = [
  { to: "/", label: "Residents" },
  { to: "/credentials", label: "Credentials" },
  { to: "/care-plan", label: "Care Plan" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/timekeeping", label: "Timekeeping" },
  { to: "/payroll", label: "Payroll" },
  { to: "/settings", label: "Settings" },
];

export function PageShell({ children }) {
  const navigate = useNavigate();
  const user = auth.getUser();
  const tenant = auth.getTenant();
  const isAdmin = user?.role === "admin";

  function handleLogout() {
    auth.logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <span className="shrink-0 text-sm font-semibold tracking-tight text-stone-900">
            CareFit <span className="text-emerald-600">Connect</span>
          </span>

          <span className="h-4 w-px shrink-0 bg-stone-200" />

          <div className="min-w-0 flex-1">
            {isAdmin ? (
              <TenantSwitcher />
            ) : (
              <span className="block truncate text-sm font-medium text-stone-700">{tenant?.name}</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-4">
            {isAdmin && (
              <span className="hidden rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500 sm:inline-flex">
                Admin
              </span>
            )}
            <button
              onClick={handleLogout}
              className="rounded text-sm text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
            >
              Log out
            </button>
          </div>
        </div>
        <nav className="no-scrollbar mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto border-t border-stone-100 px-4">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                `shrink-0 rounded-t border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-inset ${
                  isActive
                    ? "border-emerald-600 font-medium text-stone-900"
                    : "border-transparent text-stone-500 hover:text-stone-800"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
