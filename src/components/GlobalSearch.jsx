// src/components/GlobalSearch.jsx
// Searches residents and staff by name from data already available to the
// app (no new backend endpoint) — click a result to jump straight to it.
// Staff have no dedicated profile page yet, so a match routes to Onboarding
// with that employee pre-selected, which is the closest real destination.
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [residents, setResidents] = useState([]);
  const [employees, setEmployees] = useState([]);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.residents.list().then(setResidents).catch(() => {});
    api.employees.list().then(setEmployees).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const q = query.trim().toLowerCase();
  const matchedResidents = q ? residents.filter((r) => r.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const matchedEmployees = q ? employees.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 5) : [];
  const hasResults = matchedResidents.length > 0 || matchedEmployees.length > 0;

  function goTo(path) {
    navigate(path);
    setQuery("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative hidden w-full max-w-[220px] md:block">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
            clipRule="evenodd"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search residents, staff…"
          className="w-full rounded-lg border border-stone-300 bg-stone-50 py-1.5 pl-8 pr-3 text-sm text-stone-900 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
      </div>
      {open && q && (
        <div className="absolute left-0 top-full z-20 mt-1 w-72 rounded-lg border border-stone-200 bg-white py-2 shadow-lg">
          {!hasResults && <p className="px-3 py-2 text-sm text-stone-400">No matches for "{query}"</p>}
          {matchedResidents.length > 0 && (
            <div className="mb-1">
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-stone-400">Residents</p>
              {matchedResidents.map((r) => (
                <button
                  key={r.id}
                  onClick={() => goTo(`/residents/${r.id}`)}
                  className="block w-full px-3 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                >
                  {r.name}
                </button>
              ))}
            </div>
          )}
          {matchedEmployees.length > 0 && (
            <div>
              <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-stone-400">Staff</p>
              {matchedEmployees.map((e) => (
                <button
                  key={e.id}
                  onClick={() => goTo(`/onboarding?employee=${e.id}`)}
                  className="block w-full px-3 py-1.5 text-left text-sm text-stone-700 hover:bg-stone-50"
                >
                  {e.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
