// src/components/InviteAfhModal.jsx
// Everything an admin needs to invite an outside AFH onto the placement
// provider list: the public /afh-intake link, a ready-to-send message (editable
// before sending) with shortcuts for WhatsApp, text and email, and a QR code
// that opens the same form, downloadable as a PNG for flyers.
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Modal } from "./Modal";
import { Button } from "./Button";

const CAREFIT_PHONE = "(206) 476-0550";

function defaultMessage(url) {
  return `Hi! CareFit Connect helps families in Washington find the right Adult Family Home. If you'd like us to refer families to your home, you can add it to our provider list here. It takes a few minutes and you don't need an account:

${url}

Questions? Call us at ${CAREFIT_PHONE}.`;
}

export function InviteAfhModal({ intakeUrl, onClose }) {
  const [message, setMessage] = useState(() => defaultMessage(intakeUrl));
  const [copied, setCopied] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState(null);

  useEffect(() => {
    QRCode.toDataURL(intakeUrl, { width: 768, margin: 2, color: { dark: "#1c1917", light: "#ffffff" } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [intakeUrl]);

  function copy(text, what) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    });
  }

  const encoded = encodeURIComponent(message);
  const shortcutClass =
    "inline-flex items-center justify-center rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40";

  return (
    <Modal title="Invite an AFH" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <h3 className="mb-1.5 text-xs font-medium text-stone-600">Signup link</h3>
          <div className="flex gap-2">
            <input
              id="invite-link"
              readOnly
              value={intakeUrl}
              onFocus={(e) => e.target.select()}
              className="min-w-0 flex-1 rounded-lg border border-stone-300 bg-stone-50 px-3 py-2 text-sm text-stone-800"
            />
            <Button variant="secondary" size="sm" onClick={() => copy(intakeUrl, "link")}>
              {copied === "link" ? "Copied!" : "Copy link"}
            </Button>
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            No account needed. Submissions show up here as "Pending review" until you approve them.
          </p>
        </section>

        <section>
          <label htmlFor="invite-message" className="mb-1.5 block text-xs font-medium text-stone-600">
            Invite message <span className="font-normal text-stone-400">(edit before sending if you like)</span>
          </label>
          <textarea
            id="invite-message"
            rows={8}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm leading-relaxed text-stone-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="primary" size="sm" onClick={() => copy(message, "message")}>
              {copied === "message" ? "Copied!" : "Copy message"}
            </Button>
            <a className={shortcutClass} href={`https://wa.me/?text=${encoded}`} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a className={shortcutClass} href={`sms:?&body=${encoded}`}>
              Text message
            </a>
            <a
              className={shortcutClass}
              href={`mailto:?subject=${encodeURIComponent("Join the CareFit Connect provider list")}&body=${encoded}`}
            >
              Email
            </a>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-4 border-t border-stone-200 pt-5">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              width={128}
              height={128}
              alt="QR code that opens the AFH signup form"
              className="h-32 w-32 rounded-lg border border-stone-200"
            />
          ) : (
            <div className="h-32 w-32 rounded-lg border border-dashed border-stone-300" />
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-stone-900">QR code for flyers</h3>
            <p className="mt-0.5 text-xs text-stone-500">
              Scanning it with a phone camera opens the signup form. Print it on flyers or show it at events.
            </p>
            {qrDataUrl && (
              <a
                className={`${shortcutClass} mt-3`}
                href={qrDataUrl}
                download="carefit-afh-signup-qr.png"
              >
                Download QR code
              </a>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
