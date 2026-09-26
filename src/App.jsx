// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PageShell } from "./components/PageShell";
import { KioskShell } from "./components/KioskShell";
import { EmployeeShell } from "./components/EmployeeShell";
import { RequireAuth } from "./components/RequireAuth";
import { auth } from "./lib/api";
import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { ResidentList } from "./pages/ResidentList";
import { ResidentProfile } from "./pages/ResidentProfile";
import { ResidentCompare } from "./pages/ResidentCompare";
import { EmployeeResidents } from "./pages/EmployeeResidents";
import { EmployeeResidentDetail } from "./pages/EmployeeResidentDetail";
import { CareTeam } from "./pages/CareTeam";
import { Documents } from "./pages/Documents";
import { Credentials } from "./pages/Credentials";
import { FireDrills } from "./pages/FireDrills";
import { Onboarding } from "./pages/Onboarding";
import { Timekeeping } from "./pages/Timekeeping";
import { Clock } from "./pages/Clock";
import { Payroll } from "./pages/Payroll";
import { FinanceOverview } from "./pages/FinanceOverview";
import { Analytics } from "./pages/Analytics";
import { Expenses } from "./pages/Expenses";
import { CarePlan } from "./pages/CarePlan";
import { Settings } from "./pages/Settings";
import { PlacementInquiries } from "./pages/PlacementInquiries";
import { PlacementDetail } from "./pages/PlacementDetail";
import { PlacementFacilities } from "./pages/PlacementFacilities";
import { PrivacyPolicy } from "./pages/legal/PrivacyPolicy";
import { Eula } from "./pages/legal/Eula";
import { AfhIntakeForm } from "./pages/AfhIntakeForm";
import { PlacementFamilyReview } from "./pages/PlacementFamilyReview";
import { ResidentFaceSheetPrint } from "./pages/ResidentFaceSheetPrint";

// A kiosk-role login (a shared clock-in tablet, see Settings' "Clock-in
// tablet" card) only ever sees the Clock page — no nav, no other routes,
// regardless of what URL it's on. This check runs inside the route element
// rather than in App() itself, so it re-evaluates on a genuine mount (e.g.
// right after logging in) instead of being frozen from before login. The
// backend enforces the same restriction independently (kioskRestrict.js),
// so this is a UX nicety, not the actual security boundary.
function AuthedApp() {
  const user = auth.getUser();
  const isAdmin = user?.role === "admin";

  if (user?.role === "kiosk") {
    return (
      <KioskShell>
        <Clock />
      </KioskShell>
    );
  }

  // A caregiver's own login (their own phone) — a completely separate, much
  // smaller route set from the admin/manager app below. Backend enforcement
  // is the real boundary (employeeRestrict.js); this is just the matching UX.
  if (user?.role === "employee") {
    return (
      <EmployeeShell>
        <Routes>
          <Route path="/" element={<EmployeeResidents />} />
          <Route path="/residents/:id" element={<EmployeeResidentDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </EmployeeShell>
    );
  }

  return (
    <PageShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/residents" element={<ResidentList />} />
        <Route path="/residents/compare" element={<ResidentCompare />} />
        <Route path="/residents/:id" element={<ResidentProfile />} />
        <Route path="/care-team" element={<CareTeam />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/credentials" element={<Credentials />} />
        <Route path="/fire-drills" element={<FireDrills />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/timekeeping" element={<Timekeeping />} />
        <Route path="/clock" element={<Clock />} />
        {/* Payroll is admin-only too — same route-guard pattern as Settings below. */}
        <Route path="/payroll" element={isAdmin ? <Payroll /> : <Navigate to="/" replace />} />
        <Route path="/finance" element={<FinanceOverview />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/care-plan" element={<CarePlan />} />
        {/* Placement is cross-tenant (spans every AFH, not just the current
            one) and admin-only for the same reason Facilities/QuickBooks are —
            see placements.js's own comment for why it deliberately isn't
            tenant-scoped like everything else. */}
        <Route path="/placement" element={<Navigate to="/placement/inquiries" replace />} />
        <Route path="/placement/inquiries" element={isAdmin ? <PlacementInquiries /> : <Navigate to="/" replace />} />
        <Route path="/placement/inquiries/:id" element={isAdmin ? <PlacementDetail /> : <Navigate to="/" replace />} />
        <Route path="/placement/facilities" element={isAdmin ? <PlacementFacilities /> : <Navigate to="/" replace />} />
        {/* Facilities + QuickBooks are admin-only — see PageShell's nav
            filtering, which is the UX nicety; this route guard is the actual
            boundary against a manager just typing the URL. */}
        <Route path="/settings" element={isAdmin ? <Settings /> : <Navigate to="/" replace />} />
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
        {/* Public, unauthenticated — an outside AFH filling this out has no
            CareFit Connect account at all. See publicIntake.js on the backend. */}
        <Route path="/afh-intake" element={<AfhIntakeForm />} />
        {/* Public, unauthenticated — a family reviewing shortlisted AFHs has
            no CareFit Connect account. Gated by an opaque, unguessable,
            expiring token, not a login — see publicIntake.js on the backend. */}
        <Route path="/family-review/:token" element={<PlacementFamilyReview />} />
        {/* Authenticated but deliberately rendered without PageShell — a
            clean single page for the browser's own print/save-as-PDF, no
            sidebar or header to hide with print CSS. Contains real resident
            PII (SSN, Medicare/Medicaid numbers), so still behind RequireAuth
            unlike the public routes above. */}
        <Route
          path="/residents/:id/face-sheet"
          element={
            <RequireAuth>
              <ResidentFaceSheetPrint />
            </RequireAuth>
          }
        />
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
