// src/components/QuickBooksMappings.jsx
// Lets a connected tenant map each expense category and payment method to a
// real QuickBooks account, so expenses can be pushed as Purchases. Shown
// under Settings → QuickBooks, only once QuickBooks is connected.
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "./Button";
import { Select } from "./Select";
import { CardSkeleton } from "./CardSkeleton";
import { titleCase } from "../lib/format";

const PAYMENT_TYPE_LABELS = { Cash: "Cash", Check: "Check", CreditCard: "Credit Card" };
const REVENUE_LINE_TYPE_LABELS = { private_pay_portion: "Private Pay", medicaid_portion: "Medicaid" };

// Best-guess default PaymentType for a newly-picked account — a Credit Card
// account can only post as CreditCard in QuickBooks; a Bank account defaults
// to Check but can be switched to Cash.
function defaultPaymentType(accountType) {
  return accountType === "Credit Card" ? "CreditCard" : "Check";
}

export function QuickBooksMappings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveMessage, setSaveMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [revenueLineTypes, setRevenueLineTypes] = useState([]);
  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [paymentAccounts, setPaymentAccounts] = useState([]);
  const [items, setItems] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [paymentAccountMap, setPaymentAccountMap] = useState({});
  const [revenueItemMap, setRevenueItemMap] = useState({});

  useEffect(() => {
    Promise.all([api.quickbooks.getMappings(), api.quickbooks.getAccounts(), api.quickbooks.getItems()])
      .then(([mappings, accounts, itemsResult]) => {
        setCategories(mappings.categories);
        setPaymentMethods(mappings.paymentMethods);
        setRevenueLineTypes(mappings.revenueLineTypes);
        setCategoryMap(mappings.categoryMap);
        setPaymentAccountMap(mappings.paymentAccountMap);
        setRevenueItemMap(mappings.revenueItemMap);
        setExpenseAccounts(accounts.expenseAccounts);
        setPaymentAccounts(accounts.paymentAccounts);
        setItems(itemsResult.items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function setCategoryAccount(category, accountId) {
    const account = expenseAccounts.find((a) => a.id === accountId);
    setCategoryMap((m) => ({
      ...m,
      [category]: account ? { accountId: account.id, accountName: account.name } : undefined,
    }));
  }

  function setPaymentAccount(method, accountId) {
    const account = paymentAccounts.find((a) => a.id === accountId);
    setPaymentAccountMap((m) => ({
      ...m,
      [method]: account
        ? { accountId: account.id, accountName: account.name, paymentType: defaultPaymentType(account.accountType) }
        : undefined,
    }));
  }

  function setPaymentType(method, paymentType) {
    setPaymentAccountMap((m) => ({ ...m, [method]: { ...m[method], paymentType } }));
  }

  function setRevenueItem(lineType, itemId) {
    const item = items.find((i) => i.id === itemId);
    setRevenueItemMap((m) => ({
      ...m,
      [lineType]: item ? { itemId: item.id, itemName: item.name } : undefined,
    }));
  }

  async function handleSave() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await api.quickbooks.saveMappings({ categoryMap, paymentAccountMap, revenueItemMap });
      setSaveMessage({ ok: true, text: "Saved." });
    } catch (err) {
      setSaveMessage({ ok: false, text: err.message });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <CardSkeleton lines={4} />;
  if (error) {
    return <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">Couldn't load QuickBooks accounts: {error}</p>;
  }

  return (
    <div className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium text-stone-900">Expense sync mapping</h3>
      <p className="mt-1 text-sm text-stone-500">
        Map each expense category and payment method to a QuickBooks account so expenses can be synced as Purchases.
      </p>

      <div className="mt-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Category → Expense account</div>
        <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {categories.map((category) => (
            <div key={category} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-stone-700">{category}</span>
              <Select
                value={categoryMap[category]?.accountId || ""}
                onChange={(e) => setCategoryAccount(category, e.target.value)}
              >
                <option value="">Not mapped</option>
                {expenseAccounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Revenue line → QuickBooks item</div>
        <p className="mb-2 text-xs text-stone-500">
          So Private Pay and Medicaid revenue post to separate items in QuickBooks, instead of one lumped-together item.
        </p>
        <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {revenueLineTypes.map((lineType) => (
            <div key={lineType} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-stone-700">{REVENUE_LINE_TYPE_LABELS[lineType] || lineType}</span>
              <Select
                value={revenueItemMap[lineType]?.itemId || ""}
                onChange={(e) => setRevenueItem(lineType, e.target.value)}
              >
                <option value="">Not mapped</option>
                {items.map((i) => (
                  <option key={i.id} value={i.id}>{i.name}</option>
                ))}
              </Select>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <div className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-500">Payment method → Account</div>
        <div className="divide-y divide-stone-100 rounded-xl border border-stone-200">
          {paymentMethods.map((method) => (
            <div key={method} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-stone-700">{titleCase(method)}</span>
              <div className="flex items-center gap-2">
                {paymentAccountMap[method]?.accountId && (
                  <Select
                    value={paymentAccountMap[method].paymentType}
                    onChange={(e) => setPaymentType(method, e.target.value)}
                  >
                    {Object.entries(PAYMENT_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </Select>
                )}
                <Select
                  value={paymentAccountMap[method]?.accountId || ""}
                  onChange={(e) => setPaymentAccount(method, e.target.value)}
                >
                  <option value="">Not mapped</option>
                  {paymentAccounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save mapping"}
        </Button>
        {saveMessage && (
          <span className={`text-sm ${saveMessage.ok ? "text-emerald-700" : "text-rose-600"}`}>{saveMessage.text}</span>
        )}
      </div>
    </div>
  );
}
