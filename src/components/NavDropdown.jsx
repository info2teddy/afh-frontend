// src/components/NavDropdown.jsx
// A top-level nav button that reveals a small set of related pages on click,
// instead of listing them all inline. Highlights itself when the current
// route is one of its children, so the active section stays visible even
// with the menu closed.
//
// The menu portals to document.body rather than rendering inline: the nav
// bar has overflow-x-auto for horizontal scrolling on narrow screens, and
// per the CSS overflow spec, setting overflow-x forces overflow-y to compute
// as auto too — an absolutely-positioned child would get silently clipped
// the moment it extended past the bar's height.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { NavLink, useLocation } from "react-router-dom";

export function NavDropdown({ label, icon, items }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const location = useLocation();
  const isActiveGroup = items.some((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`));

  function openMenu() {
    const rect = buttonRef.current.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.left });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e) {
      if (buttonRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onReposition() {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("scroll", onReposition, true);
    window.addEventListener("resize", onReposition);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      window.removeEventListener("scroll", onReposition, true);
      window.removeEventListener("resize", onReposition);
    };
  }, [open]);

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        className={`flex items-center gap-1.5 border-b-2 px-3 py-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-inset ${
          isActiveGroup
            ? "border-emerald-600 font-medium text-stone-900"
            : "border-transparent text-stone-500 hover:text-stone-800"
        }`}
      >
        <span aria-hidden="true">{icon}</span>
        {label}
        <svg
          className={`h-3 w-3 text-stone-400 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open &&
        menuPos &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: menuPos.top,
              left: menuPos.left,
              transformOrigin: "top left",
              animation: "dropdown-in 140ms cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="z-50 w-48 overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
          >
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-emerald-50 font-medium text-emerald-700" : "text-stone-700 hover:bg-stone-50"
                  }`
                }
              >
                <span aria-hidden="true">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
