// src/components/PageShell.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { useScrollFade } from "../lib/useScrollFade";
import { TenantSwitcher } from "./TenantSwitcher";
import { GlobalSearch } from "./GlobalSearch";
import { NavDropdown } from "./NavDropdown";

// Dashboard and Residents are daily-use enough to stay as standalone links;
// everything else groups into a dropdown by function, so the bar reads as
// seven top-level choices instead of eleven flat, same-weight tabs.
const NAV_ITEMS = [
  { type: "link", to: "/", label: "Dashboard", icon: "🏠" },
  { type: "link", to: "/residents", label: "Residents", icon: "👤" },
  {
    type: "dropdown",
    label: "Care Team",
    icon: "👥",
    items: [
      { to: "/care-team", label: "Roster", icon: "👥" },
      { to: "/onboarding", label: "Onboarding", icon: "📝" },
    ],
  },
  {
    type: "dropdown",
    label: "Operations",
    icon: "⏱",
    items: [
      { to: "/timekeeping", label: "Timekeeping", icon: "⏱" },
      { to: "/clock", label: "Clock", icon: "🕐" },
    ],
  },
  {
    type: "dropdown",
    label: "Compliance",
    icon: "🎓",
    items: [
      { to: "/credentials", label: "Credentials", icon: "🎓" },
      { to: "/documents", label: "Documents", icon: "📄" },
    ],
  },
  {
    type: "dropdown",
    label: "Finance",
    icon: "💰",
    items: [
      { to: "/finance", label: "Overview", icon: "📊" },
      { to: "/analytics", label: "Analytics", icon: "📈" },
      { to: "/expenses", label: "Expenses", icon: "🧾" },
      { to: "/payroll", label: "Payroll", icon: "💰" },
    ],
  },
  {
    type: "dropdown",
    label: "Settings",
    icon: "⚙️",
    items: [
      { to: "/care-plan", label: "Care Plans", icon: "📋" },
      { to: "/settings", label: "General", icon: "⚙️" },
    ],
  },
];

const navLinkClass = ({ isActive }) =>
  `shrink-0 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-inset ${
    isActive
      ? "border-emerald-600 font-medium text-stone-900"
      : "border-transparent text-stone-500 hover:text-stone-800"
  }`;

export function PageShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.getUser();
  const tenant = auth.getTenant();
  const isAdmin = user?.role === "admin";

  const { ref: navRef, canScrollLeft, canScrollRight, onScroll: updateScrollState } = useScrollFade();

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

          <div className="min-w-0 shrink-0">
            {isAdmin ? (
              <TenantSwitcher />
            ) : (
              <span className="block truncate text-sm font-medium text-stone-700">{tenant?.name}</span>
            )}
          </div>

          <div className="flex flex-1 justify-end">
            <GlobalSearch />
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
        <div className="relative mx-auto max-w-5xl border-t border-stone-100">
          {canScrollLeft && (
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-8 items-center bg-gradient-to-r from-white to-transparent">
              <span className="text-stone-400">‹</span>
            </div>
          )}
          <nav
            ref={navRef}
            onScroll={updateScrollState}
            className="no-scrollbar flex items-center gap-1 overflow-x-auto px-4"
          >
            {NAV_ITEMS.map((entry) =>
              entry.type === "link" ? (
                <NavLink key={entry.to} to={entry.to} end={entry.to === "/"} className={navLinkClass}>
                  <span className="mr-1.5" aria-hidden="true">{entry.icon}</span>
                  {entry.label}
                </NavLink>
              ) : (
                <NavDropdown key={entry.label} label={entry.label} icon={entry.icon} items={entry.items} />
              )
            )}
          </nav>
          {canScrollRight && (
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex w-8 items-center justify-end bg-gradient-to-l from-white to-transparent">
              <span className="text-stone-400">›</span>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <div key={location.pathname} style={{ animation: "fade-in 200ms ease-out" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
