// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../lib/api";
import { Button } from "../components/Button";
import carefitIcon from "../assets/carefit-icon.svg";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !password) {
      setError("Enter both email and password.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const user = await auth.login(email, password);
      navigate(user.role === "kiosk" ? "/clock" : "/");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(61,90,128,0.08), transparent), #fafaf9",
      }}
    >
      <div className="w-full max-w-sm" style={{ animation: "panel-in 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <div className="mb-8 text-center">
          <img src={carefitIcon} alt="" className="mx-auto mb-4 h-14 w-auto" />
          <div className="mb-1.5 text-lg font-semibold tracking-tight text-stone-900">
            CareFit <span className="text-brand-600">Connect</span>
          </div>
          <p className="text-sm text-stone-500">Sign in to manage your home</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
        >
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Email</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-600">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
          )}

          <Button type="submit" variant="primary" disabled={busy} className="w-full">
            {busy ? "Logging in…" : "Log in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
