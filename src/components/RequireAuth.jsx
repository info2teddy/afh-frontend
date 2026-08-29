// src/components/RequireAuth.jsx
import { Navigate } from "react-router-dom";
import { auth } from "../lib/api";

export function RequireAuth({ children }) {
  if (!auth.isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
