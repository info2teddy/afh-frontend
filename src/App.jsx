// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageShell } from "./components/PageShell";
import { KioskShell } from "./components/KioskShell";
import { RequireAuth } from "./components/RequireAuth";
import { auth } from "./lib/api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ResidentList } from "./pages/ResidentList";
import { ResidentProfile } from "./pages/ResidentProfile";
import { CareTeam } from "./pages/CareTeam";
import { Documents } from "./pages/Documents";
import { Credentials } from "./pages/Credentials";
import { Onboarding } from "./pages/Onboarding";
import { Timekeeping } from "./pages/Timekeeping";
import { Clock } from "./pages/Clock";
import { Payroll } from "./pages/Payroll";
import { FinanceOverview } from "./pages/FinanceOverview";
import { Analytics } from "./pages/Analytics";
import { Expenses } from "./pages/Expenses";
import { CarePlan } from "./pages/CarePlan";
import { Settings } from "./pages/Settings";
import { PrivacyPolicy } from "./pages/legal/PrivacyPolicy";
import { Eula } from "./pages/legal/Eula";

// A kiosk-role login (a shared clock-in tablet, see Settings' "Clock-in
// tablet" card) only ever sees the Clock page — no nav, no other routes,
// regardless of what URL it's on. This check runs inside the route element
// rather than in App() itself, so it re-evaluates on a genuine mount (e.g.
// right after logging in) instead of being frozen from before login. The
// backend enforces the same restriction independently (kioskRestrict.js),
// so this is a UX nicety, not the actual security boundary.
function AuthedApp() {
  const user = auth.getUser();

  if (user?.role === "kiosk") {
    return (
      <KioskShell>
        <Clock />
      </KioskShell>
    );
  }

  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/residents" element={<ResidentList />} />
        <Route path="/residents/:id" element={<ResidentProfile />} />
        <Route path="/care-team" element={<CareTeam />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/timekeeping" element={<Timekeeping />} />
        <Route path="/clock" element={<Clock />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/finance" element={<FinanceOverview />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/care-plan" element={<CarePlan />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </PageShell>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/legal/privacy" element={<PrivacyPolicy />} />
        <Route path="/legal/eula" element={<Eula />} />
        <Route
          path="/*"
          element={
            <RequireAuth>
              <AuthedApp />
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
