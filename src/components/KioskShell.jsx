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
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(circle at 15% -10%, rgba(224,122,95,0.1), transparent 45%)," +
          "radial-gradient(circle at 100% 0%, rgba(61,90,128,0.1), transparent 50%)," +
          "#fafaf9",
      }}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <span className="text-sm font-semibold text-stone-600">{tenant?.name}</span>
        <button
          onClick={handleLogout}
          className="rounded p-1.5 text-xs text-stone-400 transition-colors hover:text-stone-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 focus-visible:ring-offset-2"
        >
          Log out
        </button>
      </header>
      <main className="mx-auto max-w-5xl px-6 pb-10">{children}</main>
    </div>
  );
}
