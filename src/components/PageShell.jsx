// src/components/PageShell.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { auth } from "../lib/api";

const NAV_ITEMS = [
  { to: "/", label: "Residents" },
  { to: "/credentials", label: "Credentials" },
  { to: "/onboarding", label: "Onboarding" },
  { to: "/timekeeping", label: "Timekeeping" },
  { to: "/payroll", label: "Payroll" },
];

export function PageShell({ children }) {
  const navigate = useNavigate();

  function handleLogout() {
    auth.logout();
    navigate("/login");
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px", fontFamily: "sans-serif" }}>
      <nav style={{ display: "flex", gap: 20, marginBottom: 28, borderBottom: "1px solid #e4e2d8", paddingBottom: 12, alignItems: "center" }}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              fontSize: 14,
              textDecoration: "none",
              color: isActive ? "#1a1a1a" : "#73726c",
              fontWeight: isActive ? 500 : 400,
            })}
          >
            {item.label}
          </NavLink>
        ))}
        <button
          onClick={handleLogout}
          style={{ marginLeft: "auto", fontSize: 13, color: "#73726c", background: "none", border: "none", cursor: "pointer" }}
        >
          Log out
        </button>
      </nav>
      {children}
    </div>
  );
}
