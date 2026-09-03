// src/pages/legal/PrivacyPolicy.jsx
import { LegalLayout, Section } from "./LegalLayout";

export function PrivacyPolicy() {
  return (
    <LegalLayout title="Privacy Policy" updated="September 3, 2026">
      <Section title="Overview">
        <p>
          CareFit Connect ("CareFit Connect," "we," "us") provides software that Adult Family
          Homes ("AFH businesses," "you," "your organization") use to manage residents, staff
          credentials, timekeeping, payroll, invoicing, and AI-drafted care plans. This policy
          describes what information we collect through the app and how we use it.
        </p>
      </Section>

      <Section title="Information we collect">
        <p>We collect information you and your staff enter directly into CareFit Connect:</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Account information:</strong> email address and a securely hashed password for each user.</li>
          <li><strong>Business information:</strong> your organization's name and the users associated with it.</li>
          <li><strong>Resident information:</strong> names and care-related details your staff enter, used to generate invoices and draft care plans.</li>
          <li><strong>Employee information:</strong> names, credential/certification records and expiration dates, and shift/timekeeping records.</li>
          <li><strong>Financial records:</strong> invoices and payroll runs generated within the app, and — only if you choose to connect QuickBooks Online — the QuickBooks realm ID and OAuth access token needed to sync invoices to your own QuickBooks account.</li>
        </ul>
      </Section>

      <Section title="How we use this information">
        <p>
          We use the information above solely to operate the features you use: scheduling,
          payroll, invoicing, onboarding tracking, QuickBooks sync, and AI-drafted care plans. We
          do not sell personal information, and we do not use it for advertising.
        </p>
      </Section>

      <Section title="AI-drafted care plans">
        <p>
          When your staff use the Care Plan feature, the resident information relevant to that
          plan is sent to Anthropic's Claude API to generate a draft. Anthropic processes this
          data solely to return the generated text and does not use it to train models, under our
          agreement with them. Generated care plans are drafts only — your staff review and
          approve them before use.
        </p>
      </Section>

      <Section title="Third parties we share data with">
        <p>
          We share data only with the service providers necessary to provide a feature you've
          used:
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Intuit / QuickBooks Online</strong> — only if you connect your QuickBooks account, and only the invoice data needed to push an invoice you initiate.</li>
          <li><strong>Anthropic</strong> — only when you generate an AI-drafted care plan, as described above.</li>
          <li><strong>Infrastructure providers</strong> (our hosting and database providers) — to store and run the application. They do not use your data for their own purposes.</li>
        </ul>
        <p>We do not otherwise sell or share personal information with third parties.</p>
      </Section>

      <Section title="Data security">
        <p>
          Passwords are hashed and never stored in plain text. Access to the application requires
          a signed session token issued at login. Each business's data is isolated from every
          other business using the platform.
        </p>
      </Section>

      <Section title="Data retention and deletion">
        <p>
          We retain your organization's data for as long as your account is active. To request
          deletion of your organization's data, contact us at the email below.
        </p>
      </Section>

      <Section title="Children's privacy">
        <p>
          CareFit Connect is a business tool for AFH staff and is not directed at children. We do
          not knowingly collect information from children under 13.
        </p>
      </Section>

      <Section title="Changes to this policy">
        <p>
          We may update this policy from time to time. Changes will be posted on this page with
          an updated "Last updated" date.
        </p>
      </Section>

      <Section title="Contact us">
        <p>
          Questions about this policy or your data? Contact us at{" "}
          <a href="mailto:legal@carefitconnect.com" className="text-emerald-700 hover:underline">
            legal@carefitconnect.com
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
