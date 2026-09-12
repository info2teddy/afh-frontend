// src/components/PageShell.jsx
// Sidebar layout, replacing the old horizontal top-nav-with-dropdowns —
// validated first as a mockup the user reviewed before this was wired up.
// A flat, always-visible grouped list beats click-to-open dropdown menus for
// discoverability, and as a side effect removes an entire class of dropdown
// accessibility work (portal positioning, aria-haspopup/expanded, Escape
// handling) since nothing here is a popup anymore — it's just links.
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import carefitIcon from "../assets/carefit-icon.svg";
import { TenantSwitcher } from "./TenantSwitcher";
import { GlobalSearch } from "./GlobalSearch";
import { Icon } from "./icons";

// Dashboard and Residents are daily-use enough to stay standalone; everything
// else groups under one icon (shown on the group's first item) plus a small
// section label, same content as before — just laid out vertically now.
// "Settings" (Facilities + QuickBooks) and "Payroll" are admin-only —
// flagged as too technical/risky (Settings) or too consequential (Payroll)
// for an AFH owner/manager to do unsupervised. Settings is a standalone
// link appended at the end, rather than a group, since with Care Plans
// moved out (it's a resident-care tool, not a settings page) it was down
// to a single item anyway. Payroll just drops out of the Finance group.
function getNavItems(isAdmin) {
  const financeItems = [
    { to: "/finance", label: "Overview" },
    { to: "/analytics", label: "Analytics" },
    { to: "/expenses", label: "Expenses" },
  ];
  if (isAdmin) financeItems.push({ to: "/payroll", label: "Payroll" });

  const items = [
    { type: "link", to: "/", label: "Dashboard", icon: "home" },
    { type: "link", to: "/residents", label: "Residents", icon: "resident" },
    { type: "group", label: "Care Team", icon: "team", items: [{ to: "/care-team", label: "Roster" }, { to: "/onboarding", label: "Onboarding" }] },
    { type: "group", label: "Operations", icon: "clock", items: [{ to: "/timekeeping", label: "Timekeeping" }, { to: "/clock", label: "Clock" }] },
    { type: "group", label: "Compliance", icon: "shield", items: [{ to: "/credentials", label: "Credentials" }, { to: "/documents", label: "Documents" }, { to: "/care-plan", label: "Care Plans" }] },
    { type: "group", label: "Finance", icon: "finance", items: financeItems },
  ];
  if (isAdmin) {
    items.push({
      type: "group",
      label: "Placement",
      icon: "resident",
      items: [
        { to: "/placement/inquiries", label: "Inquiries" },
        { to: "/placement/facilities", label: "Facilities" },
      ],
    });
  }
  if (isAdmin) items.push({ type: "link", to: "/settings", label: "Settings", icon: "gear" });
  return items;
}

function itemClass({ isActive }) {
  return `relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13.5px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 ${
    isActive
      ? "bg-white/15 font-medium text-white before:absolute before:-left-3.5 before:bottom-1.5 before:top-1.5 before:w-[3px] before:rounded-r before:bg-accent-500 before:content-['']"
      : "text-brand-100 hover:bg-white/10 hover:text-white"
  }`;
}

const SIDEBAR_COLLAPSED_KEY = "carefit_sidebar_collapsed";

function UserMenu({ user, isAdmin, onLogout, collapsed }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const name = user?.email?.split("@")[0] || "";

  return (
    <div ref={rootRef} className="relative mt-auto border-t border-white/10 pt-3">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-[11px] font-semibold text-white">
          {name.slice(0, 2).toUpperCase()}
        </span>
        <span className={`min-w-0 flex-1 ${collapsed ? "lg:hidden" : ""}`}>
          <span className="block truncate text-[12.5px] font-medium text-white">{name}</span>
          <span className="block truncate text-[11px] text-brand-200/80">{user?.email}</span>
        </span>
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 z-20 mb-2 w-56 overflow-hidden rounded-xl border border-stone-200 bg-white py-1.5 shadow-lg"
          style={{ transformOrigin: "bottom left", animation: "dropdown-in 140ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {isAdmin && (
            <div className="px-3.5 py-1.5">
              <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">Admin</span>
            </div>
          )}
          <button
            onClick={onLogout}
            className="block w-full px-3.5 py-2 text-left text-sm text-stone-700 hover:bg-stone-50"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function PageShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = auth.getUser();
  const tenant = auth.getTenant();
  const isAdmin = user?.role === "admin";

  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const hamburgerRef = useRef(null);

  useEffect(() => setDrawerOpen(false), [location.pathname]);

  useEffect(() => {
    if (!drawerOpen) return;
    function onKeyDown(e) {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        hamburgerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

  function toggleCollapsed() {
    setCollapsed((c) => {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, c ? "0" : "1");
      return !c;
    });
  }

  function handleLogout() {
    auth.logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50 lg:flex">
      <a
        href="#main-content"
        className="sr-only rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50"
      >
        Skip to content
      </a>

      {/* Backdrop only exists below lg, where the sidebar is an off-canvas drawer */}
      <div
        onClick={() => setDrawerOpen(false)}
        className={`fixed inset-0 z-30 bg-stone-900/40 transition-opacity lg:hidden ${
          drawerOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col overflow-y-auto bg-brand-700 p-3.5 text-brand-100 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-none ${
          collapsed ? "lg:w-[70px]" : "lg:w-64"
        } ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="mb-2 flex items-center justify-between border-b border-white/10 px-1 pb-3.5">
          <span className="flex min-w-0 items-center gap-2">
            <img src={carefitIcon} alt="" className="h-5 w-5 shrink-0" />
            <span className={`truncate text-sm font-semibold text-white ${collapsed ? "lg:hidden" : ""}`}>
              CareFit <span className="text-accent-500">Connect</span>
            </span>
          </span>
          <button
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden shrink-0 rounded-md p-1 text-brand-200 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-500 lg:flex"
          >
            <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5">
          {getNavItems(isAdmin).map((entry) =>
            entry.type === "link" ? (
              <NavLink key={entry.to} to={entry.to} end={entry.to === "/"} className={itemClass}>
                <Icon name={entry.icon} />
                <span className={collapsed ? "lg:hidden" : ""}>{entry.label}</span>
              </NavLink>
            ) : (
              <div key={entry.label} className="mt-3.5 border-t border-white/10 pt-3.5 first:mt-0 first:border-0 first:pt-0">
                <div className={`px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-brand-200/75 ${collapsed ? "lg:hidden" : ""}`}>
                  {entry.label}
                </div>
                {entry.items.map((item, i) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `${itemClass({ isActive })} ${i === 0 ? "" : `pl-9 text-[13px] ${collapsed ? "lg:hidden" : ""}`}`
                    }
                  >
                    {i === 0 && <Icon name={entry.icon} />}
                    <span className={i === 0 && collapsed ? "lg:hidden" : ""}>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            )
          )}
        </nav>

        <UserMenu user={user} isAdmin={isAdmin} onLogout={handleLogout} collapsed={collapsed} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="relative flex items-center gap-3 border-b border-stone-200 bg-white px-4 py-2.5 lg:px-6">
          <button
            ref={hamburgerRef}
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" stroke="currentColor" strokeWidth="1.75" fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>

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
        </div>

        <main id="main-content" tabIndex={-1} className="w-full flex-1 px-6 py-10 focus:outline-none">
          <div key={location.pathname} style={{ animation: "fade-in 200ms ease-out" }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
