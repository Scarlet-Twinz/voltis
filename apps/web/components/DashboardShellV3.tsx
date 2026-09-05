"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, BarChart3, Bell, BookOpen, CheckCircle2, ChevronRight, CreditCard,
  FileCheck2, LayoutDashboard, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen,
  RefreshCw, Settings, ShieldCheck, Sun, Wallet, Webhook, X, Plus, Search
} from "lucide-react";
import { api, type Account, type Organization, type OverviewData, type Transaction, type TransactionsResponse } from "../lib/api";
import { useAuth } from "./AuthProvider";

type Module = "Overview" | "Accounts" | "Transactions" | "Payments" | "Ledger" | "Risk" | "Reconciliation" | "Webhooks" | "Analytics" | "Settings";
type Row = Record<string, unknown>;
type PaymentMethod = "card" | "bank_transfer" | "wallet" | "cash";

const nav: Array<{ label: Module; icon: typeof LayoutDashboard; group: string }> = [
  { label: "Overview", icon: LayoutDashboard, group: "Workspace" },
  { label: "Accounts", icon: Wallet, group: "Workspace" },
  { label: "Transactions", icon: Activity, group: "Workspace" },
  { label: "Payments", icon: CreditCard, group: "Financial operations" },
  { label: "Ledger", icon: BookOpen, group: "Financial operations" },
  { label: "Risk", icon: ShieldCheck, group: "Control" },
  { label: "Reconciliation", icon: FileCheck2, group: "Control" },
  { label: "Webhooks", icon: Webhook, group: "Infrastructure" },
  { label: "Analytics", icon: BarChart3, group: "Infrastructure" },
  { label: "Settings", icon: Settings, group: "System" },
];

const money = (value: unknown, currency = "NGN") => {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return `${currency} 0.00`;
  return new Intl.NumberFormat("en-NG", { style: "currency", currency, minimumFractionDigits: 2 }).format(n);
};
const num = (value: unknown) => new Intl.NumberFormat("en-NG").format(Number(value ?? 0));
const text = (value: unknown, fallback = "—") => typeof value === "string" && value.trim() ? value : typeof value === "number" || typeof value === "boolean" ? String(value) : fallback;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((x): x is Row => !!x && typeof x === "object" && !Array.isArray(x)) : [];
const date = (value: unknown) => typeof value === "string" && !Number.isNaN(Date.parse(value)) ? new Intl.DateTimeFormat("en-NG", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : "—";
const statusTone = (value: unknown) => {
  const s = text(value).toLowerCase();
  if (["completed", "success", "successful", "active", "allowed", "healthy", "delivered"].includes(s)) return "good";
  if (["failed", "blocked", "error", "cancelled", "canceled", "inactive"].includes(s)) return "bad";
  if (["pending", "processing", "review", "retrying"].includes(s)) return "warn";
  return "neutral";
};
const initials = (value: string) => value.trim().split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase()).join("") || "V";

export default function DashboardShellV3() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [active, setActive] = useState<Module>("Overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txAnalytics, setTxAnalytics] = useState<TransactionsResponse | null>(null);
  const [payments, setPayments] = useState<Row[]>([]);
  const [risk, setRisk] = useState<Row[]>([]);
  const [reconciliation, setReconciliation] = useState<Row[]>([]);
  const [endpoints, setEndpoints] = useState<Row[]>([]);
  const [deliveries, setDeliveries] = useState<Row[]>([]);
  const [analyticsPayments, setAnalyticsPayments] = useState<unknown>(null);
  const [analyticsRisk, setAnalyticsRisk] = useState<unknown>(null);
  const [analyticsAccounts, setAnalyticsAccounts] = useState<unknown>(null);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"payment" | "account" | "webhook" | null>(null);
  const [selected, setSelected] = useState<Transaction | Row | null>(null);
  const [settingsCurrency, setSettingsCurrency] = useState("NGN");
  const [payment, setPayment] = useState({ debitAccountId: "", creditAccountId: "", amount: "", currency: "NGN", method: "card" as PaymentMethod, description: "", idempotencyKey: "" });
  const [accountForm, setAccountForm] = useState({ code: "", name: "", type: "asset", currency: "NGN" });
  const [webhook, setWebhook] = useState({ url: "", secret: "" });
  const orgId = organization?.id ?? "";
  const currency = organization?.defaultCurrency ?? overview?.organization?.defaultCurrency ?? "NGN";
  const displayName = user?.firstName || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    const saved = localStorage.getItem("voltis_theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("voltis_theme", theme);
  }, [theme]);
  useEffect(() => {
    if (organization?.defaultCurrency) {
      setSettingsCurrency(organization.defaultCurrency);
      setPayment(p => ({ ...p, currency: organization.defaultCurrency }));
      setAccountForm(a => ({ ...a, currency: organization.defaultCurrency }));
    }
  }, [organization?.defaultCurrency]);

  async function loadWorkspace() {
    const orgs = await api.organizations.list();
    const org = orgs?.[0] ?? null;
    setOrganizations(Array.isArray(orgs) ? orgs : []);
    setOrganization(org);
    if (org) setSettingsCurrency(org.defaultCurrency);
    return org?.id ?? "";
  }
  async function loadModule(module: Module, id = orgId) {
    if (!id) return;
    if (module === "Overview") setOverview(await api.analytics.overview(id));
    if (module === "Accounts") setAccounts(await api.accounts.list(id));
    if (module === "Transactions" || module === "Ledger") {
      const [t, a] = await Promise.all([api.transactions.list(id), api.transactions.analytics(id)]);
      setTransactions(t); setTxAnalytics(a);
    }
    if (module === "Payments") {
      const [p, a] = await Promise.all([api.payments.list(id), api.accounts.list(id)]);
      setPayments(rows(p)); setAccounts(a);
    }
    if (module === "Risk") setRisk(rows(await api.risk.list(id)));
    if (module === "Reconciliation") setReconciliation(rows(await api.reconciliation.list(id)));
    if (module === "Webhooks") {
      const [e, d] = await Promise.all([api.webhooks.endpoints(id), api.webhooks.deliveries(id)]);
      setEndpoints(rows(e)); setDeliveries(rows(d));
    }
    if (module === "Analytics") {
      const [o, p, r, a, t] = await Promise.all([api.analytics.overview(id), api.analytics.payments(id), api.analytics.risk(id), api.analytics.accounts(id), api.transactions.analytics(id)]);
      setOverview(o); setAnalyticsPayments(p); setAnalyticsRisk(r); setAnalyticsAccounts(a); setTxAnalytics(t);
    }
  }
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { setLoading(true); setError(""); const id = await loadWorkspace(); if (id && !cancelled) await loadModule("Overview", id); }
      catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : "Unable to load workspace."); }
      finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);
  useEffect(() => {
    if (!orgId || active === "Overview") return;
    let cancelled = false;
    (async () => { try { setBusy(true); setError(""); await loadModule(active); } catch (e) { if (!cancelled) setError(e instanceof Error ? e.message : `Unable to load ${active}.`); } finally { if (!cancelled) setBusy(false); } })();
    return () => { cancelled = true; };
  }, [orgId, active]);

  const filteredTransactions = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return transactions;
    return transactions.filter(t => [t.reference, t.type, t.status, t.currency, t.description ?? ""].some(v => v.toLowerCase().includes(q)));
  }, [transactions, search]);
  const filteredPayments = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return payments;
    return payments.filter(p => Object.values(p).some(v => String(v ?? "").toLowerCase().includes(q)));
  }, [payments, search]);

  const openPayment = () => {
    setPayment({ debitAccountId: accounts[0]?.id ?? "", creditAccountId: accounts[1]?.id ?? "", amount: "", currency, method: "card", description: "", idempotencyKey: `pay_${crypto.randomUUID()}` });
    setModal("payment");
  };
  const openAccount = () => { setAccountForm({ code: "", name: "", type: "asset", currency }); setModal("account"); };
  const openWebhook = () => { setWebhook({ url: "", secret: "" }); setModal("webhook"); };
  async function createPayment() {
    if (!payment.debitAccountId || !payment.creditAccountId || !payment.amount) { setError("Select both accounts and enter an amount."); return; }
    if (payment.debitAccountId === payment.creditAccountId) { setError("Debit and credit accounts must be different."); return; }
    try { setSaving(true); setError(""); await api.payments.create({ organizationId: orgId, ...payment }); setModal(null); await loadModule("Payments"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create payment."); }
    finally { setSaving(false); }
  }
  async function createAccount() {
    if (!accountForm.code || !accountForm.name) { setError("Enter an account code and name."); return; }
    try { setSaving(true); setError(""); await api.accounts.create({ organizationId: orgId, ...accountForm }); setModal(null); await loadModule("Accounts"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create account."); }
    finally { setSaving(false); }
  }
  async function createWebhook() {
    if (!webhook.url || !webhook.secret) { setError("Enter the endpoint URL and signing secret."); return; }
    try { setSaving(true); setError(""); await api.webhooks.createEndpoint(orgId, webhook); setModal(null); await loadModule("Webhooks"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to create webhook."); }
    finally { setSaving(false); }
  }
  async function deleteEndpoint(id: string) {
    try { setBusy(true); await api.webhooks.deleteEndpoint(id); await loadModule("Webhooks"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to delete webhook."); }
    finally { setBusy(false); }
  }
  async function reconcile() {
    try { setBusy(true); setError(""); await api.reconciliation.run(orgId); await loadModule("Reconciliation"); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to run reconciliation."); }
    finally { setBusy(false); }
  }
  async function saveSettings() {
    try { setSaving(true); const updated = await api.organizations.update(orgId, { defaultCurrency: settingsCurrency }); setOrganization(updated); }
    catch (e) { setError(e instanceof Error ? e.message : "Unable to save settings."); }
    finally { setSaving(false); }
  }
  function select(module: Module) { setActive(module); setSearch(""); setSelected(null); setError(""); setMobileOpen(false); }
  function logoutNow() { logout(); router.replace("/login"); }

  if (loading) return <div className="v3-loading"><div className="v3-mark">V</div><strong>VOLTIS</strong><span>Preparing your financial workspace…</span></div>;

  const paymentCompleted = overview?.payments.completed ?? 0;
  const paymentTotal = overview?.payments.total ?? 0;
  const paymentRate = overview?.payments.successRate ?? 0;
  const accountBalance = overview?.accounts.balance ?? 0;
  const riskAverage = overview?.risk.averageScore ?? 0;

  return <div className={`v3-shell ${collapsed ? "collapsed" : ""}`}>
    {mobileOpen && <button className="v3-backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation" />}
    <aside className={`v3-sidebar ${mobileOpen ? "mobile-open" : ""}`}>
      <div className="v3-brand"><div className="v3-logo">V</div>{!collapsed && <div><b>VOLTIS</b><span>Financial infrastructure</span></div>}<button onClick={() => setCollapsed(x => !x)} className="v3-collapse">{collapsed ? <PanelLeftOpen size={17}/> : <PanelLeftClose size={17}/>}</button></div>
      <div className="v3-org"><span>{initials(organization?.name ?? "VOLTIS")}</span>{!collapsed && <div><small>ORGANIZATION</small><b>{organization?.name ?? "VOLTIS"}</b></div>}{!collapsed && organizations.length > 1 && <ChevronRight size={14}/>}</div>
      <nav className="v3-nav">{Array.from(new Set(nav.map(x => x.group))).map(group => <div key={group}>{!collapsed && <div className="v3-group">{group}</div>}{nav.filter(x => x.group === group).map(item => { const Icon = item.icon; return <button key={item.label} title={collapsed ? item.label : undefined} onClick={() => select(item.label)} className={`v3-nav-item ${active === item.label ? "active" : ""}`}><Icon size={17}/>{!collapsed && <span>{item.label}</span>}</button>; })}</div>)}</nav>
      <div className="v3-side-bottom"><div className="v3-online"><i/>{!collapsed && "System online"}</div><button onClick={logoutNow}><LogOut size={16}/>{!collapsed && "Sign out"}</button></div>
    </aside>

    <main className="v3-main">
      <header className="v3-topbar"><div className="v3-breadcrumb"><button className="v3-icon mobile" onClick={() => setMobileOpen(true)}><Menu size={18}/></button><span>VOLTIS</span><b>/</b><strong>{active}</strong></div><div className="v3-top-actions"><button className="v3-icon" disabled={busy} onClick={() => loadModule(active)}><RefreshCw size={17} className={busy ? "spin" : ""}/></button><button className="v3-icon"><Bell size={17}/><i/></button><button className="v3-icon" onClick={() => setTheme(x => x === "dark" ? "light" : "dark")}>{theme === "dark" ? <Sun size={17}/> : <Moon size={17}/>}</button><div className="v3-user"><span>{initials(displayName)}</span><div><b>{displayName}</b><small>{user?.email}</small></div></div></div></header>
      <section className="v3-content">
        <div className="v3-head"><div><small>FINANCIAL CONTROL CENTER</small><h1>{active === "Overview" ? `Welcome back, ${displayName}.` : active}</h1><p>{active === "Overview" ? "A single operating surface for payments, accounts, ledger integrity, risk and reconciliation." : `Manage ${active.toLowerCase()} across your VOLTIS organization.`}</p></div><div className="v3-head-tags"><span><i/> Live</span><b>{currency}</b></div></div>
        {error && <div className="v3-error"><X size={17}/><div><b>Action could not be completed</b><span>{error}</span></div><button onClick={() => setError("")}><X size={15}/></button></div>}

        {active === "Overview" && <div className="v3-stack">
          <div className="v3-kpis">
            <Kpi label="Available balance" value={money(accountBalance, currency)} note={`${num(overview?.accounts.total)} active accounts`} />
            <Kpi label="Payment volume" value={money(overview?.payments.volume, currency)} note={`${num(paymentTotal)} payments processed`} />
            <Kpi label="Success rate" value={`${Number(paymentRate).toFixed(1)}%`} note={`${num(paymentCompleted)} completed`} />
            <Kpi label="Risk score" value={Number(riskAverage).toFixed(1)} note={`${num(overview?.risk.total)} assessments`} />
          </div>
          <div className="v3-overview-grid">
            <Panel title="Payment performance" eyebrow="OPERATIONS" action="Payments" onAction={() => select("Payments")}>
              <div className="v3-performance"><div><span>Successful processing</span><strong>{Number(paymentRate).toFixed(1)}%</strong><div className="v3-progress"><i style={{ width: `${Math.max(0, Math.min(100, Number(paymentRate)))}%` }}/></div></div><div className="v3-mini-stats"><Stat label="Completed" value={num(paymentCompleted)}/><Stat label="Pending" value={num(overview?.payments.pending)}/><Stat label="Failed" value={num(overview?.payments.failed)}/><Stat label="Processing" value={num(overview?.payments.processing)}/></div></div>
            </Panel>
            <Panel title="Ledger integrity" eyebrow="CONTROL"><div className={`v3-health ${overview?.ledger.balanced ? "good" : "bad"}`}><CheckCircle2 size={20}/><div><b>{overview?.ledger.balanced ? "Ledger is balanced" : "Ledger requires review"}</b><span>Debits {money(overview?.ledger.debits, currency)} · Credits {money(overview?.ledger.credits, currency)}</span></div></div><div className="v3-two-stats"><Stat label="Reconciliations" value={num(overview?.reconciliation.total)}/><Stat label="Completed" value={num(overview?.reconciliation.completed)}/></div></Panel>
          </div>
          <Panel title="Recent financial activity" eyebrow="TRANSACTION ENGINE" action="View all" onAction={() => select("Transactions")}>
            {transactions.length === 0 ? <Empty icon={<Activity size={20}/>} title="No transaction activity yet" description="Transactions created by the financial engine will appear here."/> : <TransactionTable data={transactions.slice(0, 6)} onSelect={setSelected}/>} 
          </Panel>
        </div>}

        {active === "Accounts" && <div className="v3-stack"><ActionBar title="Account registry" description="Manage the accounts used by your double-entry ledger." button="New account" onClick={openAccount}/><Panel title="Accounts" eyebrow={`${accounts.length} ACCOUNTS`}><AccountTable data={accounts}/></Panel></div>}
        {active === "Transactions" && <div className="v3-stack"><DataToolbar search={search} setSearch={setSearch} placeholder="Search reference, status or type"/><Panel title="Transactions" eyebrow="TRANSACTION ENGINE">{filteredTransactions.length ? <TransactionTable data={filteredTransactions} onSelect={setSelected}/> : <Empty icon={<Activity size={20}/>} title="No transactions found" description={search ? "Try another search term." : "Transactions created by the financial engine will appear here."}/>}</Panel></div>}
        {active === "Ledger" && <div className="v3-stack"><div className="v3-kpis"><Kpi label="Debits" value={money(overview?.ledger.debits, currency)} note="Ledger total"/><Kpi label="Credits" value={money(overview?.ledger.credits, currency)} note="Ledger total"/><Kpi label="Balance state" value={overview?.ledger.balanced ? "Balanced" : "Review"} note="Double-entry control"/><Kpi label="Transactions" value={num(txAnalytics?.total)} note="Ledger source activity"/></div><Panel title="Ledger activity" eyebrow="DOUBLE-ENTRY"><TransactionTable data={transactions} onSelect={setSelected}/></Panel></div>}
        {active === "Payments" && <div className="v3-stack"><ActionBar title="Payment operations" description="Create and monitor payments through the financial engine." button="Create payment" onClick={openPayment}/><div className="v3-kpis"><Kpi label="Total payments" value={num(paymentTotal)} note="All payment records"/><Kpi label="Processed volume" value={money(overview?.payments.volume, currency)} note="Payment volume"/><Kpi label="Success rate" value={`${Number(paymentRate).toFixed(1)}%`} note="Completed / total"/><Kpi label="Failed" value={num(overview?.payments.failed)} note="Requires attention"/></div><DataToolbar search={search} setSearch={setSearch} placeholder="Search payments"/><Panel title="Payment activity" eyebrow="PAYMENT PROCESSING">{filteredPayments.length ? <GenericTable data={filteredPayments} preferred={["status","amount","currency","method","createdAt"]} onSelect={setSelected}/> : <Empty icon={<CreditCard size={20}/>} title="No payments yet" description="Create a payment to begin tracking processing activity."/>}</Panel></div>}
        {active === "Risk" && <div className="v3-stack"><div className="v3-kpis"><Kpi label="Assessments" value={num(overview?.risk.total)} note="Total risk decisions"/><Kpi label="Allowed" value={num(overview?.risk.allowed)} note="Passed controls"/><Kpi label="Review" value={num(overview?.risk.review)} note="Needs review"/><Kpi label="Blocked" value={num(overview?.risk.blocked)} note="Declined by controls"/></div><Panel title="Risk assessments" eyebrow="RISK ENGINE">{risk.length ? <GenericTable data={risk} preferred={["status","score","decision","createdAt"]} onSelect={setSelected}/> : <Empty icon={<ShieldCheck size={20}/>} title="No risk assessments" description="Risk decisions will appear here as payments are evaluated."/>}</Panel></div>}
        {active === "Reconciliation" && <div className="v3-stack"><ActionBar title="Reconciliation" description="Compare financial records and surface discrepancies." button="Run reconciliation" onClick={reconcile} busy={busy}/><Panel title="Reconciliation runs" eyebrow={`${reconciliation.length} RUNS`}>{reconciliation.length ? <GenericTable data={reconciliation} preferred={["status","matchedCount","discrepancyCount","createdAt"]} onSelect={setSelected}/> : <Empty icon={<FileCheck2 size={20}/>} title="No reconciliation runs" description="Run reconciliation when financial activity needs to be verified."/>}</Panel></div>}
        {active === "Webhooks" && <div className="v3-stack"><ActionBar title="Webhook delivery" description="Connect VOLTIS events to external systems." button="Add endpoint" onClick={openWebhook}/><div className="v3-overview-grid"><Panel title="Endpoints" eyebrow={`${endpoints.length} ENDPOINTS`}>{endpoints.length ? <GenericTable data={endpoints} preferred={["url","active","createdAt"]} actionKey="id" onAction={deleteEndpoint} onSelect={setSelected}/> : <Empty icon={<Webhook size={20}/>} title="No webhook endpoints" description="Add an endpoint to start receiving financial events."/>}</Panel><Panel title="Recent deliveries" eyebrow={`${deliveries.length} DELIVERIES`}>{deliveries.length ? <GenericTable data={deliveries} preferred={["status","event","createdAt"]} onSelect={setSelected}/> : <Empty icon={<Webhook size={20}/>} title="No deliveries yet" description="Webhook delivery attempts will appear here."/>}</Panel></div></div>}
        {active === "Analytics" && <Analytics overview={overview} tx={txAnalytics} payments={analyticsPayments} risk={analyticsRisk} accounts={analyticsAccounts} currency={currency}/>} 
        {active === "Settings" && <div className="v3-stack"><Panel title="Workspace settings" eyebrow="ORGANIZATION"><div className="v3-form-grid"><Field label="Organization"><input value={organization?.name ?? ""} disabled/></Field><Field label="Default currency"><select value={settingsCurrency} onChange={e => setSettingsCurrency(e.target.value)}><option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option></select></Field></div><div className="v3-form-actions"><button className="v3-primary" onClick={saveSettings} disabled={saving}>{saving ? "Saving…" : "Save changes"}</button></div></Panel></div>}
      </section>
    </main>

    {selected && <div className="v3-detail" onClick={() => setSelected(null)}><div className="v3-detail-card" onClick={e => e.stopPropagation()}><div className="v3-detail-head"><div><small>RECORD DETAILS</small><h2>Financial record</h2></div><button className="v3-icon" onClick={() => setSelected(null)}><X size={17}/></button></div><pre>{JSON.stringify(selected, null, 2)}</pre></div></div>}
    {modal === "payment" && <Modal title="Create payment" close={() => setModal(null)}><div className="v3-form-grid"><Field label="Debit account"><select value={payment.debitAccountId} onChange={e => setPayment(p => ({...p, debitAccountId: e.target.value}))}><option value="">Select account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></Field><Field label="Credit account"><select value={payment.creditAccountId} onChange={e => setPayment(p => ({...p, creditAccountId: e.target.value}))}><option value="">Select account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} · {a.name}</option>)}</select></Field><Field label="Amount"><input type="number" min="0.01" step="0.01" value={payment.amount} onChange={e => setPayment(p => ({...p, amount: e.target.value}))} placeholder="0.00"/></Field><Field label="Currency"><select value={payment.currency} onChange={e => setPayment(p => ({...p, currency: e.target.value}))}><option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option></select></Field><Field label="Payment method"><select value={payment.method} onChange={e => setPayment(p => ({...p, method: e.target.value as PaymentMethod}))}><option value="card">Card</option><option value="bank_transfer">Bank transfer</option><option value="wallet">Wallet</option><option value="cash">Cash</option></select></Field><Field label="Idempotency key"><input value={payment.idempotencyKey} onChange={e => setPayment(p => ({...p, idempotencyKey: e.target.value}))}/></Field><Field label="Description" wide><input value={payment.description} onChange={e => setPayment(p => ({...p, description: e.target.value}))} placeholder="Optional payment description"/></Field></div><ModalActions saving={saving} submit={createPayment} label="Create payment"/></Modal>}
    {modal === "account" && <Modal title="Create account" close={() => setModal(null)}><div className="v3-form-grid"><Field label="Account code"><input value={accountForm.code} onChange={e => setAccountForm(a => ({...a, code: e.target.value}))} placeholder="1000"/></Field><Field label="Account name"><input value={accountForm.name} onChange={e => setAccountForm(a => ({...a, name: e.target.value}))} placeholder="Operating cash"/></Field><Field label="Account type"><select value={accountForm.type} onChange={e => setAccountForm(a => ({...a, type: e.target.value}))}><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></Field><Field label="Currency"><select value={accountForm.currency} onChange={e => setAccountForm(a => ({...a, currency: e.target.value}))}><option>NGN</option><option>USD</option><option>EUR</option><option>GBP</option></select></Field></div><ModalActions saving={saving} submit={createAccount} label="Create account"/></Modal>}
    {modal === "webhook" && <Modal title="Add webhook endpoint" close={() => setModal(null)}><div className="v3-form-grid"><Field label="Endpoint URL" wide><input type="url" value={webhook.url} onChange={e => setWebhook(w => ({...w, url: e.target.value}))} placeholder="https://example.com/webhooks/voltis"/></Field><Field label="Signing secret" wide><input value={webhook.secret} onChange={e => setWebhook(w => ({...w, secret: e.target.value}))} placeholder="Signing secret"/></Field></div><ModalActions saving={saving} submit={createWebhook} label="Add endpoint"/></Modal>}
  </div>;
}

function Kpi({ label, value, note }: { label: string; value: string; note: string }) { return <div className="v3-kpi"><span>{label}</span><strong>{value}</strong><small>{note}</small></div>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><span>{label}</span><b>{value}</b></div>; }
function Panel({ title, eyebrow, action, onAction, children }: { title: string; eyebrow?: string; action?: string; onAction?: () => void; children: React.ReactNode }) { return <section className="v3-panel"><header><div><small>{eyebrow}</small><h2>{title}</h2></div>{action && <button className="v3-link" onClick={onAction}>{action}<ChevronRight size={14}/></button>}</header><div className="v3-panel-body">{children}</div></section>; }
function ActionBar({ title, description, button, onClick, busy }: { title: string; description: string; button: string; onClick: () => void; busy?: boolean }) { return <div className="v3-actionbar"><div><small>OPERATIONS</small><b>{title}</b><span>{description}</span></div><button className="v3-primary" onClick={onClick} disabled={busy}><Plus size={15}/>{busy ? "Working…" : button}</button></div>; }
function DataToolbar({ search, setSearch, placeholder }: { search: string; setSearch: (x: string) => void; placeholder: string }) { return <div className="v3-toolbar"><div><small>DATA VIEW</small><b>Operational records</b></div><label><Search size={15}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder={placeholder}/></label></div>; }
function Empty({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) { return <div className="v3-empty"><div>{icon}</div><b>{title}</b><span>{description}</span></div>; }
function AccountTable({ data }: { data: Account[] }) { return data.length ? <div className="v3-table"><table><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Currency</th><th>Balance</th><th>Status</th></tr></thead><tbody>{data.map(a => <tr key={a.id}><td><b>{a.code}</b></td><td>{a.name}</td><td>{a.type}</td><td>{a.currency}</td><td>{money(a.balance, a.currency)}</td><td><span className={`v3-status ${statusTone(a.isActive ? "active" : "inactive")}`}>{a.isActive ? "Active" : "Inactive"}</span></td></tr>)}</tbody></table></div> : <Empty icon={<Wallet size={20}/>} title="No accounts yet" description="Create the first account for this organization."/>; }
function TransactionTable({ data, onSelect }: { data: Transaction[]; onSelect: (x: Transaction) => void }) { return <div className="v3-table"><table><thead><tr><th>Reference</th><th>Type</th><th>Amount</th><th>Status</th><th>Created</th></tr></thead><tbody>{data.map(t => <tr key={t.id} onClick={() => onSelect(t)} className="click"><td><b>{t.reference}</b><small>{t.description || "Financial transaction"}</small></td><td>{t.type}</td><td>{money(t.amount, t.currency)}</td><td><span className={`v3-status ${statusTone(t.status)}`}>{t.status}</span></td><td>{date(t.createdAt)}</td></tr>)}</tbody></table></div>; }
function GenericTable({ data, preferred, onSelect, actionKey, onAction }: { data: Row[]; preferred: string[]; onSelect: (x: Row) => void; actionKey?: string; onAction?: (id: string) => void }) { const keys = preferred.filter(k => data.some(r => r[k] !== undefined)); return <div className="v3-table"><table><thead><tr>{keys.map(k => <th key={k}>{k.replace(/[A-Z]/g, m => ` ${m}`).toUpperCase()}</th>)}{actionKey && <th>Action</th>}</tr></thead><tbody>{data.map((r, i) => <tr key={String(r.id ?? i)} className="click" onClick={() => onSelect(r)}>{keys.map(k => <td key={k}>{k.toLowerCase().includes("date") || k.toLowerCase().includes("at") ? date(r[k]) : k === "status" || k === "decision" || k === "active" ? <span className={`v3-status ${statusTone(r[k])}`}>{text(r[k])}</span> : text(r[k])}</td>)}{actionKey && <td><button className="v3-danger" onClick={e => { e.stopPropagation(); if (r[actionKey]) onAction?.(String(r[actionKey])); }}>Delete</button></td>}</tr>)}</tbody></table></div>; }
function Analytics({ overview, tx, payments, risk, accounts, currency }: { overview: OverviewData | null; tx: TransactionsResponse | null; payments: unknown; risk: unknown; accounts: unknown; currency: string }) { const p = payments && typeof payments === "object" ? payments as Row : {}; const r = risk && typeof risk === "object" ? risk as Row : {}; const a = accounts && typeof accounts === "object" ? accounts as Row : {}; return <div className="v3-stack"><div className="v3-kpis"><Kpi label="Payment volume" value={money(overview?.payments.volume, currency)} note={`${num(overview?.payments.total)} total payments`}/><Kpi label="Transaction volume" value={money(overview?.transactions.volume, currency)} note={`${num(overview?.transactions.total)} transactions`}/><Kpi label="Account balance" value={money(overview?.accounts.balance, currency)} note={`${num(overview?.accounts.total)} accounts`}/><Kpi label="Average risk" value={Number(overview?.risk.averageScore ?? 0).toFixed(1)} note="Current assessment score"/></div><div className="v3-overview-grid"><Panel title="Payment analytics" eyebrow="FINANCIAL PERFORMANCE"><div className="v3-analytics-list"><MetricLine label="Completed payments" value={num(overview?.payments.completed)}/><MetricLine label="Failed payments" value={num(overview?.payments.failed)}/><MetricLine label="Pending payments" value={num(overview?.payments.pending)}/><MetricLine label="Processing payments" value={num(overview?.payments.processing)}/><MetricLine label="Success rate" value={`${Number(overview?.payments.successRate ?? 0).toFixed(1)}%`}/>{Object.entries(p).slice(0, 3).map(([k,v]) => <MetricLine key={k} label={pretty(k)} value={text(v)}/>)}</div></Panel><Panel title="Risk & control" eyebrow="CONTROL HEALTH"><div className="v3-analytics-list"><MetricLine label="Allowed decisions" value={num(overview?.risk.allowed)}/><MetricLine label="Review decisions" value={num(overview?.risk.review)}/><MetricLine label="Blocked decisions" value={num(overview?.risk.blocked)}/><MetricLine label="Ledger balance" value={overview?.ledger.balanced ? "Balanced" : "Review required"}/>{Object.entries(r).slice(0, 3).map(([k,v]) => <MetricLine key={k} label={pretty(k)} value={text(v)}/>)}</div></Panel></div><Panel title="Transaction mix" eyebrow="VOLUME & DISTRIBUTION"><div className="v3-analytics-list">{Object.entries(tx?.byStatus ?? {}).map(([k,v]) => <MetricLine key={k} label={`${pretty(k)} transactions`} value={num(v)}/>)}{Object.entries(tx?.byType ?? {}).map(([k,v]) => <MetricLine key={`t-${k}`} label={`${pretty(k)} type`} value={num(v)}/>)}{Object.entries(a).slice(0, 5).map(([k,v]) => <MetricLine key={`a-${k}`} label={pretty(k)} value={text(v)}/>)}</div></Panel></div>; }
function MetricLine({ label, value }: { label: string; value: string }) { return <div className="v3-metric-line"><span>{label}</span><b>{value}</b></div>; }
function pretty(k: string) { return k.replace(/([A-Z])/g, " $1").replace(/[_-]/g, " ").replace(/^./, x => x.toUpperCase()); }
function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={`v3-field ${wide ? "wide" : ""}`}><span>{label}</span>{children}</label>; }
function Modal({ title, close, children }: { title: string; close: () => void; children: React.ReactNode }) { return <div className="v3-modal-backdrop" onClick={close}><div className="v3-modal" onClick={e => e.stopPropagation()}><header><div><small>VOLTIS OPERATIONS</small><h2>{title}</h2></div><button className="v3-icon" onClick={close}><X size={17}/></button></header>{children}</div></div>; }
function ModalActions({ saving, submit, label }: { saving: boolean; submit: () => void; label: string }) { return <div className="v3-modal-actions"><button className="v3-secondary" type="button">Cancel</button><button className="v3-primary" onClick={submit} disabled={saving}>{saving ? "Saving…" : label}</button></div>; }
