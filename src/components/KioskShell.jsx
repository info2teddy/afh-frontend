// src/components/KioskShell.jsx
// Minimal chrome for a kiosk-role session — no nav, no search, none of the
// other pages exist for this login (enforced server-side too, see
// kioskRestrict.js). Just enough header to identify the business and let a
// manager log the tablet out for reconfiguration.
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/api";

export function KioskShell({ children }) {
  const navigate = useNavigate();
  const tenant = auth.getTenant();

  function handleLogout() {
    auth.logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="flex items-center justify-between border-b border-stone-200 bg-white px-6 py-3">
        <span className="text-sm font-medium text-stone-700">{tenant?.name}</span>
        <button
          onClick={handleLogout}
          className="rounded text-xs text-stone-400 transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2"
        >
          Log out
        </button>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">{children}</main>
    </div>
  );
}
