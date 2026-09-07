// src/components/PageShell.jsx
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import carefitIcon from "../assets/carefit-icon.svg";
import { useScrollFade } from "../lib/useScrollFade";
import { TenantSwitcher } from "./TenantSwitcher";
import { GlobalSearch } from "./GlobalSearch";
import { NavDropdown } from "./NavDropdown";

// Dashboard and Residents are daily-use enough to stay as standalone links;
// everything else groups into a dropdown by function, so the bar reads as
// seven top-level choices instead of eleven flat, same-weight tabs.
const NAV_ITEMS = [
  { type: "link", to: "/", label: "Dashboard" },
  { type: "link", to: "/residents", label: "Residents" },
  {
    type: "dropdown",
    label: "Care Team",
    items: [
      { to: "/care-team", label: "Roster" },
      { to: "/onboarding", label: "Onboarding" },
    ],
  },
  {
    type: "dropdown",
    label: "Operations",
    items: [
      { to: "/timekeeping", label: "Timekeeping" },
      { to: "/clock", label: "Clock" },
    ],
  },
  {
    type: "dropdown",
    label: "Compliance",
    items: [
      { to: "/credentials", label: "Credentials" },
      { to: "/documents", label: "Documents" },
    ],
  },
  {
    type: "dropdown",
    label: "Finance",
    items: [
      { to: "/finance", label: "Overview" },
      { to: "/analytics", label: "Analytics" },
      { to: "/expenses", label: "Expenses" },
      { to: "/payroll", label: "Payroll" },
    ],
  },
  {
    type: "dropdown",
    label: "Settings",
    items: [
      { to: "/care-plan", label: "Care Plans" },
      { to: "/settings", label: "General" },
    ],
  },
];

const navLinkClass = ({ isActive }) =>
  `shrink-0 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-inset ${
    isActive
      ? "border-brand-600 font-medium text-stone-900"
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
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>
      <header className="relative border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3">
          <span className="flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight text-stone-900">
            <img src={carefitIcon} alt="" className="h-5 w-auto" />
            CareFit <span className="text-brand-600">Connect</span>
          </span>

          <span className="h-4 w-px shrink-0 bg-stone-200" />

          <div className="min-w-0 max-w-[8rem] sm:max-w-[16rem]">
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
              className="rounded text-sm text-stone-500 transition-colors hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
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
                  {entry.label}
                </NavLink>
              ) : (
                <NavDropdown key={entry.label} label={entry.label} items={entry.items} />
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
      <main id="main-content" tabIndex={-1} className="mx-auto max-w-5xl px-6 py-10 focus:outline-none">
        <div key={location.pathname} style={{ animation: "fade-in 200ms ease-out" }}>
          {children}
        </div>
      </main>
    </div>
  );
}
