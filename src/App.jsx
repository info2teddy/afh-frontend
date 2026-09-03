// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageShell } from "./components/PageShell";
import { RequireAuth } from "./components/RequireAuth";
import { Login } from "./pages/Login";
import { ResidentList } from "./pages/ResidentList";
import { ResidentInvoice } from "./pages/ResidentInvoice";
import { Credentials } from "./pages/Credentials";
import { Onboarding } from "./pages/Onboarding";
import { Timekeeping } from "./pages/Timekeeping";
import { Payroll } from "./pages/Payroll";
import { CarePlan } from "./pages/CarePlan";
import { Settings } from "./pages/Settings";
import { PrivacyPolicy } from "./pages/legal/PrivacyPolicy";
import { Eula } from "./pages/legal/Eula";

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
              <PageShell>
                <Routes>
                  <Route path="/" element={<ResidentList />} />
                  <Route path="/residents/:id" element={<ResidentInvoice />} />
                  <Route path="/credentials" element={<Credentials />} />
                  <Route path="/onboarding" element={<Onboarding />} />
                  <Route path="/timekeeping" element={<Timekeeping />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/care-plan" element={<CarePlan />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </PageShell>
            </RequireAuth>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
