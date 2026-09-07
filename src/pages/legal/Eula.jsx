// src/pages/legal/Eula.jsx
import { LegalLayout, Section } from "./LegalLayout";

export function Eula() {
  return (
    <LegalLayout title="End-User License Agreement" updated="September 3, 2026">
      <Section title="1. Acceptance">
        <p>
          This agreement governs use of CareFit Connect (the "Service") by Adult Family Home
          businesses and their staff ("you"). By creating an account or logging in, you agree to
          these terms on behalf of the organization you represent.
        </p>
      </Section>

      <Section title="2. License grant">
        <p>
          We grant you a limited, non-exclusive, non-transferable, revocable license to access
          and use the Service for your organization's internal operations, for as long as your
          account remains active and in good standing.
        </p>
      </Section>

      <Section title="3. Accounts">
        <p>
          You are responsible for safeguarding your login credentials and for all activity under
          your account. You must be an authorized representative of the AFH business you're
          registering.
        </p>
      </Section>

      <Section title="4. Acceptable use">
        <p>You agree not to:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Reverse engineer, decompile, or attempt to extract the source code of the Service.</li>
          <li>Resell, sublicense, or provide the Service to third parties outside your organization.</li>
          <li>Upload data you don't have the right to enter into the Service.</li>
          <li>Use the Service for any unlawful purpose.</li>
        </ul>
      </Section>

      <Section title="5. Your data">
        <p>
          You retain ownership of the resident, employee, and business data you enter into the
          Service. You grant us a license to process that data solely to provide the Service to
          you, as described in our{" "}
          <a href="/legal/privacy" className="text-brand-700 hover:underline">Privacy Policy</a>.
        </p>
      </Section>

      <Section title="6. AI-drafted care plans">
        <p>
          The Care Plan feature uses an AI model to draft resident care plans from information you
          provide. These drafts are a starting point only — they are not a substitute for
          professional judgment, and your qualified staff must review and approve a care plan
          before relying on it. We are not responsible for care decisions made on the basis of an
          unreviewed AI-generated draft.
        </p>
      </Section>

      <Section title="7. Third-party integrations">
        <p>
          If you connect QuickBooks Online, that integration is also governed by Intuit's own
          terms of service. We are not responsible for the availability or behavior of third-party
          services we integrate with.
        </p>
      </Section>

      <Section title="8. Disclaimer of warranties">
        <p>
          The Service is provided "as is," without warranties of any kind, express or implied,
          including fitness for a particular purpose or uninterrupted availability.
        </p>
      </Section>

      <Section title="9. Limitation of liability">
        <p>
          To the maximum extent permitted by law, CareFit Connect is not liable for indirect,
          incidental, or consequential damages arising from your use of the Service.
        </p>
      </Section>

      <Section title="10. Termination">
        <p>
          We may suspend or terminate access for violation of this agreement. You may stop using
          the Service at any time; contact us to request account and data deletion.
        </p>
      </Section>

      <Section title="11. Changes to this agreement">
        <p>
          We may update this agreement from time to time. Continued use of the Service after a
          change constitutes acceptance of the updated terms.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>
          Questions about this agreement? Contact us at{" "}
          <a href="mailto:legal@carefitconnect.com" className="text-brand-700 hover:underline">
            legal@carefitconnect.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
