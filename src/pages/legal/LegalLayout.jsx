// src/pages/legal/LegalLayout.jsx
// Shared chrome for public legal pages (privacy policy, EULA) — outside
// RequireAuth, since these must be reachable by anyone, including Intuit's
// review process, without logging in.
import { Link } from "react-router-dom";

export function LegalLayout({ title, updated, children }) {
  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-6 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-white" fill="currentColor">
              <path d="M12 3 3 10v11h6.5v-6h5v6H21V10z" />
            </svg>
          </div>
          <Link to="/login" className="text-sm font-semibold tracking-tight text-stone-900">
            CareFit <span className="text-brand-600">Connect</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-stone-900">{title}</h1>
        <p className="mt-1 mb-10 text-sm text-stone-500">Last updated {updated}</p>
        <div className="space-y-8 text-sm leading-relaxed text-stone-700">{children}</div>
      </main>
    </div>
  );
}

export function Section({ title, children }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-stone-900">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
