// src/components/TenantConfirm.jsx
// One extra confirmation for the actions where acting on the wrong business is
// costly — calculating/submitting payroll, generating an invoice, pushing to
// QuickBooks. It names the business in the banner, the body and on the confirm
// button, in that business's colour (see lib/tenantColor.js), because an admin
// works across several AFHs and the slip to guard against is "right action,
// wrong business".
//
// Admin-only by design: a manager can only ever be logged into their own
// business, so for them confirm() resolves true immediately with no dialog.
import { useCallback, useState } from "react";
import { auth } from "../lib/api";
import { getTenantColor } from "../lib/tenantColor";
import { Modal } from "./Modal";
import { Button } from "./Button";

function TenantConfirmModal({ title, body, facts, confirmLabel, onDone }) {
  const tenant = auth.getTenant();
  const color = getTenantColor(tenant?.id);
  const name = tenant?.name || "this business";

  return (
    <Modal
      title={title}
      onClose={() => onDone(false)}
      banner={
        <div className="px-6 py-2 text-xs font-medium text-white" style={{ backgroundColor: color }}>
          {name}
        </div>
      }
    >
      <p className="text-sm text-stone-700">
        {body} <span className="font-semibold text-stone-900">{name}</span>.
      </p>

      {facts?.length > 0 && (
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm">
          <dt className="text-stone-500">Business</dt>
          <dd className="text-stone-900">{name}</dd>
          {facts.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-stone-500">{label}</dt>
              <dd className="text-stone-900">{value}</dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={() => onDone(false)}>Cancel</Button>
        <Button
          variant="primary"
          style={{ backgroundColor: color }}
          onClick={() => onDone(true)}
        >
          {confirmLabel} for {name}
        </Button>
      </div>
    </Modal>
  );
}

// const { confirm, dialog } = useTenantConfirm();
//   if (!(await confirm({ title, body, facts, confirmLabel }))) return;
// ...and render {dialog} once somewhere in the component's output.
// `body` is a sentence fragment that ends right before the business name.
export function useTenantConfirm() {
  const isAdmin = auth.getUser()?.role === "admin";
  const [pending, setPending] = useState(null);

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        if (!isAdmin) return resolve(true);
        setPending({ options, resolve });
      }),
    [isAdmin]
  );

  function done(answer) {
    pending?.resolve(answer);
    setPending(null);
  }

  const dialog = pending ? <TenantConfirmModal {...pending.options} onDone={done} /> : null;
  return { confirm, dialog };
}
