// src/pages/ResidentFaceSheetPrint.jsx
// Standalone printable page — deliberately NOT wrapped in PageShell (see
// App.jsx) so there's no sidebar/header to hide with print CSS, just a
// clean single page for the browser's own print/save-as-PDF. Laid out to
// match the real "Resident face sheet info form" template the user
// provided (a one-page AFH intake sheet), not a redesigned version of it —
// same field order, same table shape. Blank fields print as a blank
// underline, exactly like the original paper form, never a fabricated
// placeholder value.
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../lib/api";
import { formatFriendlyDate, formatRevision } from "../lib/format";

function splitName(fullName) {
  const parts = (fullName || "").trim().split(/\s+/);
  if (parts.length < 2) return { first: parts[0] || "", last: "" };
  return { first: parts[0], last: parts[parts.length - 1] };
}

function ageFromDob(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hasHadBirthdayThisYear =
    today.getUTCMonth() > birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() >= birth.getUTCDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return String(age);
}

function contactByRole(contacts, role) {
  return contacts?.find((c) => c.role === role) || {};
}

// A cell that prints as label-only with a blank underline when there's no
// value — matches the original form's "Label:_____" underlined-blank style.
function Blank({ value }) {
  return value ? <span>{value}</span> : <span className="inline-block w-full border-b border-stone-400">&nbsp;</span>;
}

const cellClass = "border border-stone-800 px-3 py-2 align-top text-[13px]";
const labelClass = "font-medium";

export function ResidentFaceSheetPrint() {
  const { id } = useParams();
  const [resident, setResident] = useState(null);
  const [ssn, setSsn] = useState("");
  const [ssnSettled, setSsnSettled] = useState(false);
  const [error, setError] = useState(null);

  // The resident payload no longer carries the SSN — this is the one place the
  // full number is fetched. If it can't be read (nothing on file, or it fails
  // to decrypt) the line simply prints blank, like every other empty field.
  useEffect(() => {
    api.residents
      .getSocialSecurityNumber(id)
      .then((r) => setSsn(r.socialSecurityNumber || ""))
      .catch(() => {})
      .finally(() => setSsnSettled(true)); // don't let anyone print before this settles — a blank SSN line would be silently wrong
  }, [id]);

  useEffect(() => {
    api.residents.get(id).then(setResident).catch((err) => setError(err.message));
  }, [id]);

  if (error) return <p className="p-8 text-sm text-rose-700">{error}</p>;
  if (!resident || !ssnSettled) return <p className="p-8 text-sm text-stone-500">Loading…</p>;

  const { first, last } = splitName(resident.name);
  const ec1 = contactByRole(resident.contacts, "emergency_contact_1");
  const ec2 = contactByRole(resident.contacts, "emergency_contact_2");
  const socialWorker = contactByRole(resident.contacts, "social_worker");
  const financialWorker = contactByRole(resident.contacts, "financial_worker");
  const nurseDelegator = contactByRole(resident.contacts, "nurse_delegator");
  const pharmacy = contactByRole(resident.contacts, "pharmacy");
  const doctor = contactByRole(resident.contacts, "primary_care_doctor");
  const specialists = ["specialist_1", "specialist_2", "specialist_3"].map((r) => contactByRole(resident.contacts, r));

  return (
    <div className="mx-auto max-w-3xl bg-white px-8 py-10 text-stone-900">
      <div className="mb-4 flex justify-end print:hidden">
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Print / Save as PDF
        </button>
      </div>

      <div className="mb-6 text-center text-sm leading-7">
        <div>AFH NAME: <Blank value={resident.home?.name} /></div>
        <div>ADDRESS: <Blank value={resident.home?.address} /></div>
        <div>Phone Number: <Blank value={resident.home?.phone} /></div>
        <div>Fax: <Blank value={resident.home?.fax} /></div>
      </div>

      <table className="w-full border-collapse text-left">
        <tbody>
          <tr>
            <td className={cellClass}><div className={labelClass}>First NAME</div><Blank value={first} /></td>
            <td className={cellClass}><div className={labelClass}>Middle Name</div><Blank value={resident.middleName} /></td>
            <td className={cellClass}><div className={labelClass}>Last Name</div><Blank value={last} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Birthdate</div><Blank value={resident.dateOfBirth && formatFriendlyDate(resident.dateOfBirth)} /></td>
            <td className={cellClass}><div className={labelClass}>Social Security Number</div><Blank value={ssn} /></td>
            <td className={cellClass}>
              <div className={labelClass}>CODE STATUS</div>
              <div>DNR&nbsp;&nbsp;{resident.dnrStatus === "yes" ? "☒ Yes  ☐ No" : resident.dnrStatus === "no" ? "☐ Yes  ☒ No" : "☐ Yes  ☐ No"}</div>
            </td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Age</div><Blank value={ageFromDob(resident.dateOfBirth)} /></td>
            <td className={cellClass}></td>
            <td className={cellClass}><div className={labelClass}>Advanced Directives Type</div><Blank value={resident.advancedDirectivesType} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>MEDICARE NUMBER</div><Blank value={resident.medicareNumber} /></td>
            <td className={cellClass}><div className={labelClass}>Medicaid Number</div><Blank value={resident.medicaidNumber} /></td>
            <td className={cellClass}><div className={labelClass}>Supplementary Insurance</div><Blank value={resident.supplementaryInsurance} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Emergency Contact 1</div><Blank value={ec1.name} /></td>
            <td className={cellClass}><div className={labelClass}>Phone Number</div><Blank value={ec1.phone} /></td>
            <td className={cellClass}><div className={labelClass}>Address / email</div><Blank value={ec1.address || ec1.email} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Emergency Contact 2</div><Blank value={ec2.name} /></td>
            <td className={cellClass}><div className={labelClass}>Phone Number</div><Blank value={ec2.phone} /></td>
            <td className={cellClass}><div className={labelClass}>Address / email</div><Blank value={ec2.address || ec2.email} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Social Worker</div><Blank value={socialWorker.name} /></td>
            <td className={cellClass}>Phone: <Blank value={socialWorker.phone} /><br />Fax: <Blank value={socialWorker.fax} /></td>
            <td className={cellClass}><div className={labelClass}>Email</div><Blank value={socialWorker.email} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Financial Worker</div><Blank value={financialWorker.name} /></td>
            <td className={cellClass}>Phone: <Blank value={financialWorker.phone} /><br />Fax: <Blank value={financialWorker.fax} /></td>
            <td className={cellClass}><div className={labelClass}>Email</div><Blank value={financialWorker.email} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Nurse Delegator</div><Blank value={nurseDelegator.name} /></td>
            <td className={cellClass}>Phone: <Blank value={nurseDelegator.phone} /><br />Fax: <Blank value={nurseDelegator.fax} /></td>
            <td className={cellClass}><div className={labelClass}>Email</div><Blank value={nurseDelegator.email} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Pharmacy</div><Blank value={pharmacy.name} /></td>
            <td className={cellClass}>Phone: <Blank value={pharmacy.phone} /><br />Fax: <Blank value={pharmacy.fax} /></td>
            <td className={cellClass}><div className={labelClass}>Email</div><Blank value={pharmacy.email} /></td>
          </tr>
          <tr>
            <td className={cellClass}><div className={labelClass}>Primary Care Doctor</div><Blank value={doctor.name} /></td>
            <td className={cellClass}>Phone: <Blank value={doctor.phone} /><br />Fax: <Blank value={doctor.fax} /></td>
            <td className={cellClass}>Address: <Blank value={doctor.address} /><br />Email: <Blank value={doctor.email} /></td>
          </tr>
          {specialists.map((s, i) => (
            <tr key={i}>
              <td className={cellClass}><div className={labelClass}>Specialist/Type</div><Blank value={s.name && s.specialty ? `${s.name} — ${s.specialty}` : s.name || s.specialty} /></td>
              <td className={cellClass}>Phone: <Blank value={s.phone} /><br />Fax: <Blank value={s.fax} /></td>
              <td className={cellClass}>Address: <Blank value={s.address} /><br />Email: <Blank value={s.email} /></td>
            </tr>
          ))}
          <tr>
            <td colSpan={3} className={cellClass}><span className={labelClass}>DIAGNOSIS: </span><Blank value={resident.diagnosis} /></td>
          </tr>
          <tr>
            <td colSpan={3} className={cellClass}><span className={labelClass}>ALLERGIES: </span><Blank value={resident.allergies} /></td>
          </tr>
          <tr>
            <td colSpan={3} className={cellClass}><span className={labelClass}>Admission Date: </span><Blank value={resident.moveInDate && formatFriendlyDate(resident.moveInDate)} /></td>
          </tr>
          <tr>
            <td colSpan={3} className={cellClass}><span className={labelClass}>Discharge Date: </span><Blank value={resident.moveOutDate && formatFriendlyDate(resident.moveOutDate)} /></td>
          </tr>
        </tbody>
      </table>

      {/* Not part of the original paper form — added so a reprinted sheet can
          be told apart from the stale copy already in the binder. When the
          face sheet has never been saved through the app, this prints as a
          blank underline to be filled in by hand rather than inventing a
          date, same discipline as every other empty field here. */}
      <div className="mt-3 flex items-baseline gap-2 text-[11px] text-stone-600">
        <span className="whitespace-nowrap font-medium">Last updated:</span>
        <span className="min-w-[14rem] flex-1">
          <Blank value={resident.faceSheetUpdatedAt && formatRevision(resident.faceSheetUpdatedAt)} />
        </span>
      </div>
    </div>
  );
}
