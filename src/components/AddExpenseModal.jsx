// src/components/AddExpenseModal.jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Select } from "./Select";

const inputClass =
  "w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";
const labelClass = "mb-1 block text-xs font-medium text-stone-600";

const CATEGORIES = ["Food & Supplies", "Rent", "Utilities", "Medical Supplies", "Insurance", "Other"];

export function AddExpenseModal({ onClose, onCreated }) {
  const [homes, setHomes] = useState(null);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanNote, setScanNote] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: "Food & Supplies",
    vendor: "",
    amount: "",
    homeId: "",
    paymentMethod: "business_card",
    notes: "",
  });

  useEffect(() => {
    api.homes
      .list()
      .then((data) => {
        setHomes(data);
        if (data.length === 1) setForm((f) => ({ ...f, homeId: data[0].id }));
      })
      .catch((err) => setError(err.message));
  }, []);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0] || null;
    if (file && file.size > 10 * 1024 * 1024) {
      setError("Receipt file is too large — 10MB max.");
      return;
    }
    setError(null);
    setReceiptFile(file);
    setScanNote(null);

    // Only images can be scanned (the backend rejects PDFs for extraction) —
    // auto-scan on upload so the user doesn't have to remember an extra step.
    if (file && file.type !== "application/pdf") {
      setScanning(true);
      try {
        const extracted = await api.expenses.extractReceipt(file);
        setForm((f) => ({
          ...f,
          vendor: extracted.vendor || f.vendor,
          date: extracted.date || f.date,
          amount: extracted.amount != null ? String(extracted.amount) : f.amount,
          category: extracted.category || f.category,
        }));
        setScanNote("Fields below were filled in from the receipt — review before saving.");
      } catch (err) {
        setScanNote(`Couldn't auto-read the receipt (${err.message}) — enter details manually.`);
      } finally {
        setScanning(false);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.homeId || !form.date || !form.category || !form.amount) {
      setError("Facility, date, category, and amount are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const expense = await api.expenses.create({ ...form, receipt: receiptFile });
      onCreated(expense);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Add expense" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className={labelClass}>Receipt</label>
          <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-stone-300 px-3 py-2.5 text-sm text-stone-500 hover:border-emerald-500 hover:text-emerald-700">
            {scanning ? "Scanning receipt…" : receiptFile ? receiptFile.name : "📎 Upload or scan a receipt"}
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={scanning}
              className="hidden"
            />
          </label>
          {scanNote && <p className="mt-1.5 text-xs text-stone-500">{scanNote}</p>}
        </div>

        <div>
          <label className={labelClass}>Vendor</label>
          <input className={inputClass} value={form.vendor} onChange={(e) => set("vendor", e.target.value)} placeholder="e.g. Costco" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Date *</label>
            <input type="date" className={inputClass} value={form.date} onChange={(e) => set("date", e.target.value)} />
          </div>
          <div>
            <label className={labelClass}>Amount *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClass}
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              placeholder="342.50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Category *</label>
            <Select className="w-full" value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className={labelClass}>Payment method</label>
            <Select className="w-full" value={form.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              <option value="business_card">Business Card</option>
              <option value="check">Check</option>
              <option value="cash">Cash</option>
              <option value="other">Other</option>
            </Select>
          </div>
        </div>

        {homes && homes.length > 1 && (
          <div>
            <label className={labelClass}>Facility *</label>
            <Select className="w-full" value={form.homeId} onChange={(e) => set("homeId", e.target.value)}>
              <option value="">Select a facility…</option>
              {homes.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </Select>
          </div>
        )}

        <div>
          <label className={labelClass}>Notes</label>
          <textarea
            rows={2}
            className={`${inputClass} resize-none`}
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="e.g. Monthly food supplies"
          />
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}

        <div className="mt-1 flex flex-wrap items-center justify-end gap-3">
          <span className="mr-auto text-xs text-stone-400" title="QuickBooks account mapping isn't set up yet">
            Sync to QuickBooks — coming soon
          </span>
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={saving || scanning}>
            {saving ? "Saving…" : "Save Expense"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
